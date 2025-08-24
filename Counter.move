module {{addr}}::prediction_market {
    use std::signer;
    use std::vector;
    use aptos_std::string::{String, utf8};
    use aptos_std::table::{Self, Table};
    use aptos_framework::event;
    use aptos_framework::timestamp;
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::AptosCoin;

    /************************************
     * Constants & Types
     ************************************/
    /// 0.01 APT in octas (1 APT = 100_000_000 octas)
    const MARKET_CREATION_FEE: u64 = 1_000_000; // 0.01 APT

    /// Market entity
    struct Market has copy, drop, store {
        id: u64,
        company: String,
        bond_id: String,
        question: String,
        deadline: u64,            // unix seconds
        yes_pool: u64,            // total YES stake in octas
        no_pool: u64,             // total NO stake in octas
        resolved: bool,
        outcome: bool,            // true = YES (default), false = NO
        creator: address,
        created_at: u64,
    }

    /// Position/bet
    struct Position has copy, drop, store {
        user: address,
        prediction: bool,         // true = YES, false = NO
        amount: u64,              // staked octas
        claimed: bool,
    }

    /// Global configuration
    struct Config has key {
        owner: address,
    }

    /// Event types
    struct MarketCreatedEvent has copy, drop, store { market_id: u64, company: String, bond_id: String, question: String, deadline: u64, creator: address }
    struct PositionPlacedEvent has copy, drop, store { market_id: u64, user: address, prediction: bool, amount: u64 }
    struct MarketResolvedEvent has copy, drop, store { market_id: u64, outcome: bool }
    struct RewardClaimedEvent has copy, drop, store { market_id: u64, user: address, amount: u64 }

    /// Event handles container
    struct Events has key {
        market_created: event::EventHandle<MarketCreatedEvent>,
        position_placed: event::EventHandle<PositionPlacedEvent>,
        market_resolved: event::EventHandle<MarketResolvedEvent>,
        reward_claimed: event::EventHandle<RewardClaimedEvent>,
    }

    /// On-chain state (tables)
    struct State has key {
        market_count: u64,
        markets: Table<u64, Market>,                 // market_id -> Market
        positions: Table<u64, vector<Position>>,     // market_id -> all positions
        vaults: Table<u64, coin::Coin<AptosCoin>>,   // market_id -> pooled coins
    }

    /************************************
     * Module Initialization
     ************************************/
    /// Must be called once by the publisher to set up storage and events.
    public entry fun init_module(publisher: &signer) {
        let addr = signer::address_of(publisher);
        assert!(!exists<Config>(addr), 0);
        move_to(publisher, Config { owner: addr });
        move_to(publisher, Events {
            market_created: event::new_event_handle<MarketCreatedEvent>(publisher),
            position_placed: event::new_event_handle<PositionPlacedEvent>(publisher),
            market_resolved: event::new_event_handle<MarketResolvedEvent>(publisher),
            reward_claimed: event::new_event_handle<RewardClaimedEvent>(publisher),
        });
        move_to(publisher, State {
            market_count: 0,
            markets: Table::new<u64, Market>(),
            positions: Table::new<u64, vector<Position>>(),
            vaults: Table::new<u64, coin::Coin<AptosCoin>>(),
        });
    }

    /************************************
     * Entry Functions (Transactions)
     ************************************/
    /// Create a market. Sender pays a 0.01 APT creation fee.
    /// `company`, `bond_id`, and `question` are UTF-8 strings passed as bytes from the frontend.
    public entry fun create_market(
        creator: &signer,
        company: vector<u8>,
        bond_id: vector<u8>,
        question: vector<u8>,
        deadline: u64,
        mut fee: coin::Coin<AptosCoin>,
    ) acquires Config, Events, State {
        let addr = signer::address_of(creator);
        let now = timestamp::now_seconds();
        assert!(deadline > now, 1); // Deadline must be in the future
        assert!(vector::length(&company) > 0, 2);
        assert!(vector::length(&bond_id) > 0, 3);
        assert!(vector::length(&question) > 0, 4);

        // Fee handling: split exact fee, return any change to the creator
        let fee_amount = coin::value(&fee);
        assert!(fee_amount >= MARKET_CREATION_FEE, 5);
        let to_owner = coin::extract(&mut fee, MARKET_CREATION_FEE);
        let change = fee; // whatever remains after extract

        // Pay the owner
        let owner = borrow_global<Config>(@{{addr}}).owner;
        coin::deposit(owner, to_owner);
        // Return change to creator (if any)
        if (coin::value(&change) > 0) coin::deposit(addr, change);

        // Create market
        let state = borrow_global_mut<State>(@{{addr}});
        let id = state.market_count;
        let m = Market {
            id,
            company: utf8(company),
            bond_id: utf8(bond_id),
            question: utf8(question),
            deadline,
            yes_pool: 0,
            no_pool: 0,
            resolved: false,
            outcome: false,
            creator: addr,
            created_at: now,
        };
        Table::add(&mut state.markets, id, m);
        Table::add(&mut state.positions, id, vector::empty<Position>());
        // Initialize empty vault with 0; we'll add the first stake directly by inserting the first coin when a bet arrives.
        state.market_count = id + 1;

        // Emit event
        let ev = borrow_global_mut<Events>(@{{addr}});
        event::emit(&mut ev.market_created, MarketCreatedEvent { market_id: id, company: borrow_global<State>(@{{addr}}).markets.borrow(&id).company, bond_id: borrow_global<State>(@{{addr}}).markets.borrow(&id).bond_id, question: borrow_global<State>(@{{addr}}).markets.borrow(&id).question, deadline, creator: addr });
    }

    /// Place a prediction by sending APT. Funds are pooled in the market vault.
    public entry fun place_prediction(
        user: &signer,
        market_id: u64,
        prediction: bool,
        stake: coin::Coin<AptosCoin>,
    ) acquires State, Events {
        let addr = signer::address_of(user);
        let amount = coin::value(&stake);
        assert!(amount > 0, 10);

        let state = borrow_global_mut<State>(@{{addr}});
        assert!(Table::contains(&state.markets, &market_id), 11);
        let m_ref = Table::borrow_mut(&mut state.markets, &market_id);
        let now = timestamp::now_seconds();
        assert!(now < m_ref.deadline, 12);          // market active
        assert!(!m_ref.resolved, 13);               // not resolved

        if (prediction) {
            m_ref.yes_pool = m_ref.yes_pool + amount;
        } else {
            m_ref.no_pool = m_ref.no_pool + amount;
        }

        // Record position
        let pos_vec = Table::borrow_mut(&mut state.positions, &market_id);
        vector::push_back(pos_vec, Position { user: addr, prediction, amount, claimed: false });

        // Pool the coins into the market vault (create if missing, else merge)
        if (Table::contains(&state.vaults, &market_id)) {
            let vault = Table::borrow_mut(&mut state.vaults, &market_id);
            coin::merge(vault, stake);
        } else {
            Table::add(&mut state.vaults, market_id, stake);
        }

        // Emit event
        let ev = borrow_global_mut<Events>(@{{addr}});
        event::emit(&mut ev.position_placed, PositionPlacedEvent { market_id, user: addr, prediction, amount });
    }

    /// Resolve a market (owner only)
    public entry fun resolve_market(
        admin: &signer,
        market_id: u64,
        outcome: bool,
    ) acquires Config, State, Events {
        let cfg = borrow_global<Config>(@{{addr}});
        assert!(signer::address_of(admin) == cfg.owner, 20);

        let state = borrow_global_mut<State>(@{{addr}});
        assert!(Table::contains(&state.markets, &market_id), 21);
        let m_ref = Table::borrow_mut(&mut state.markets, &market_id);

        let now = timestamp::now_seconds();
        assert!(now >= m_ref.deadline, 22); // ended
        assert!(!m_ref.resolved, 23);

        m_ref.resolved = true;
        m_ref.outcome = outcome;

        let ev = borrow_global_mut<Events>(@{{addr}});
        event::emit(&mut ev.market_resolved, MarketResolvedEvent { market_id, outcome });
    }

    /// Claim reward for a winning position by index (index in the market positions vector).
    public entry fun claim_reward(
        claimer: &signer,
        market_id: u64,
        position_index: u64,
    ) acquires State, Events {
        let addr = signer::address_of(claimer);
        let state = borrow_global_mut<State>(@{{addr}});
        assert!(Table::contains(&state.markets, &market_id), 30);
        let m_ref = Table::borrow_mut(&mut state.markets, &market_id);
        assert!(m_ref.resolved, 31);

        let pos_vec = Table::borrow_mut(&mut state.positions, &market_id);
        let len = vector::length(pos_vec);
        assert!((position_index as u64) < (len as u64), 32);

        let pos_ref = &mut *vector::borrow_mut(pos_vec, position_index as usize);
        assert!(pos_ref.user == addr, 33);
        assert!(!pos_ref.claimed, 34);
        assert!(pos_ref.prediction == m_ref.outcome, 35); // must be on winning side

        let total_pool = m_ref.yes_pool + m_ref.no_pool;
        let winning_pool = if (m_ref.outcome) m_ref.yes_pool else m_ref.no_pool;
        // reward = (user_amount * total_pool) / winning_pool
        let reward = (pos_ref.amount * total_pool) / winning_pool;

        // Pay out from the vault
        assert!(Table::contains(&state.vaults, &market_id), 36);
        let vault = Table::borrow_mut(&mut state.vaults, &market_id);
        let payout = coin::extract(vault, reward);
        coin::deposit(addr, payout);

        pos_ref.claimed = true;

        let ev = borrow_global_mut<Events>(@{{addr}});
        event::emit(&mut ev.reward_claimed, RewardClaimedEvent { market_id, user: addr, amount: reward });
    }

    /************************************
     * Read-only helpers (view-style)
     ************************************/
    /// Get a single market by id
    public fun get_market(market_id: u64): Market acquires State {
        let s = borrow_global<State>(@{{addr}});
        assert!(Table::contains(&s.markets, &market_id), 40);
        *Table::borrow(&s.markets, &market_id)
    }

    /// Get number of markets
    public fun get_total_markets(): u64 acquires State {
        borrow_global<State>(@{{addr}}).market_count
    }

    /// Get a *copy* of all positions for a market (use off-chain filtering to get user positions)
    public fun get_positions(market_id: u64): vector<Position> acquires State {
        let s = borrow_global<State>(@{{addr}});
        assert!(Table::contains(&s.positions, &market_id), 41);
        *Table::borrow(&s.positions, &market_id)
    }

    /// Get prices as integer percentages (0..100). Returns (yes_pct, no_pct).
    public fun get_market_prices(market_id: u64): (u64, u64) acquires State {
        let s = borrow_global<State>(@{{addr}});
        assert!(Table::contains(&s.markets, &market_id), 42);
        let m = Table::borrow(&s.markets, &market_id);
        let total = m.yes_pool + m.no_pool;
        if (total == 0) {
            (50, 50)
        } else {
            ((m.yes_pool * 100) / total, (m.no_pool * 100) / total)
        }
    }
}
