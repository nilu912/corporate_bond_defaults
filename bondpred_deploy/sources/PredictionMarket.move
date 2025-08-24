module prediction_market::prediction_market {
    use std::signer;
    use std::error;
    use std::timestamp;
    use std::event;
    use std::coin;
    use std::string::String;
    use std::aptos_coin::AptosCoin;
    use std::table::{Self, Table};
    use std::vector;

    const SECONDS_PER_YEAR: u64 = 31_536_000;
    const BPS_DENOM: u64 = 10_000;

    const E_NOT_ISSUER: u64 = 1;
    const E_SALE_NOT_STARTED: u64 = 2;
    const E_SALE_ENDED: u64 = 3;
    const E_BELOW_MIN: u64 = 4;
    const E_OVER_SUBSCRIBE: u64 = 5;
    const E_ALREADY_CLAIMED: u64 = 6;
    const E_NOT_MATURED: u64 = 7;
    const E_NO_INVESTMENT: u64 = 8;
    const E_CANNOT_CANCEL: u64 = 9;
    const E_BOND_NOT_FOUND: u64 = 10;
    const E_NOT_ALL_CLAIMED: u64 = 11;

    struct Bond has key, store  {
        id: u64,
        issuer: address,
        total_raise: u64,
        rate_bps: u64,
        start_ts: u64,
        end_ts: u64,
        min_invest: u64,
        raised: u64,
        principal_vault: coin::Coin<AptosCoin>,
        interest_vault: coin::Coin<AptosCoin>,
        investments: Table<address, u64>,
        claimed: Table<address, bool>,
        canceled: bool,
        redeemed_count: u64,
        investor_count: u64,
        // Additional bond information
        company: String,
        bondId: String,
        question: String,
        description: String,
        deadline: String,
        category: String,
        couponRate: String,
        maturityDate: String,
        principalAmount: String,
        creditRating: String,
    }

    struct BondStore has key {
        next_id: u64,
        bonds: Table<u64, Bond>,
    }

    // Struct to return bond information for view functions
    struct BondInfo has drop, copy {
        id: u64,
        issuer: address,
        total_raise: u64,
        rate_bps: u64,
        start_ts: u64,
        end_ts: u64,
        min_invest: u64,
        raised: u64,
        canceled: bool,
        investor_count: u64,
        company: String,
        bondId: String,
        question: String,
        description: String,
        deadline: String,
        category: String,
        couponRate: String,
        maturityDate: String,
        principalAmount: String,
        creditRating: String,
    }

    // Events are now defined with #[event] attribute
    #[event]
    struct CreateBondEvent has drop, store {
        id: u64,
        issuer: address,
        total_raise: u64,
        rate_bps: u64,
        start_ts: u64,
        end_ts: u64,
        min_invest: u64,
        interest_reserved: u64,
        company: String,
        bondId: String,
        question: String,
        category: String,
        couponRate: String,
        maturityDate: String,
        creditRating: String,
    }

    #[event]
    struct InvestEvent has drop, store {
        id: u64,
        investor: address,
        amount: u64,
        raised_after: u64,
    }

    #[event]
    struct RedeemEvent has drop, store {
        id: u64,
        investor: address,
        principal: u64,
        interest: u64,
    }

    #[event]
    struct CancelEvent has drop, store { id: u64 }
    
    #[event]
    struct CloseEvent has drop, store { id: u64, leftover_interest_refunded: u64 }

    public entry fun init_modules(account: &signer) {
        let addr = signer::address_of(account);

        if (!exists<BondStore>(addr)) {
            move_to(account, BondStore {
                next_id: 0,
                bonds: table::new<u64, Bond>(),
            });
        };
    }

    fun calc_max_interest(total_raise: u64, rate_bps: u64, start_ts: u64, end_ts: u64): u64 {
        let dur = end_ts - start_ts;
        let num: u128 = (total_raise as u128) * (rate_bps as u128) * (dur as u128);
        let den: u128 = (SECONDS_PER_YEAR as u128) * (BPS_DENOM as u128);
        (num / den) as u64
    }

    fun calc_investor_interest(amount: u64, rate_bps: u64, start_ts: u64, end_ts: u64): u64 {
        let dur = end_ts - start_ts;
        let num: u128 = (amount as u128) * (rate_bps as u128) * (dur as u128);
        let den: u128 = (SECONDS_PER_YEAR as u128) * (BPS_DENOM as u128);
        (num / den) as u64
    }

    public entry fun create_bond(
        issuer: &signer,
        total_raise: u64,
        rate_bps: u64,
        start_ts: u64,
        end_ts: u64,
        min_invest: u64,
        interest_amount: u64,
        company: String,
        bondId: String,
        question: String,
        description: String,
        deadline: String,
        category: String,
        couponRate: String,
        maturityDate: String,
        principalAmount: String,
        creditRating: String,
    ) acquires BondStore {
        assert!(end_ts > start_ts, error::invalid_argument(0));
        let required = calc_max_interest(total_raise, rate_bps, start_ts, end_ts);
        assert!(interest_amount == required, error::invalid_argument(1));

        let addr = signer::address_of(issuer);
        let store = borrow_global_mut<BondStore>(addr);

        let id = store.next_id;
        store.next_id = id + 1;
        
        // Withdraw the interest amount from the issuer's account
        let interest_reserve = coin::withdraw<AptosCoin>(issuer, interest_amount);

        let bond = Bond {
            id,
            issuer: addr,
            total_raise,
            rate_bps,
            start_ts,
            end_ts,
            min_invest,
            raised: 0,
            principal_vault: coin::zero<AptosCoin>(),
            interest_vault: interest_reserve,
            investments: table::new<address, u64>(),
            claimed: table::new<address, bool>(),
            canceled: false,
            redeemed_count: 0,
            investor_count: 0,
            company,
            bondId,
            question,
            description,
            deadline,
            category,
            couponRate,
            maturityDate,
            principalAmount,
            creditRating,
        };
    
        table::add(&mut store.bonds, id, bond);
        
        // Emit event using the new approach
        event::emit(
            CreateBondEvent { 
                id, 
                issuer: addr, 
                total_raise, 
                rate_bps, 
                start_ts, 
                end_ts, 
                min_invest, 
                interest_reserved: required,
                company,
                bondId,
                question,
                category,
                couponRate,
                maturityDate,
                creditRating,
            }
        );
    }

    public entry fun invest(
        investor: &signer,
        bond_owner_addr: address,
        bond_id: u64,
        amount: u64,
    ) acquires BondStore {
        let store = borrow_global_mut<BondStore>(bond_owner_addr);
        assert!(table::contains(&store.bonds, bond_id), error::not_found(E_BOND_NOT_FOUND));
        let bond = table::borrow_mut(&mut store.bonds, bond_id);

        assert!(!bond.canceled, error::invalid_state(E_CANNOT_CANCEL));
        let now = timestamp::now_seconds();
        assert!(now >= bond.start_ts, error::invalid_state(E_SALE_NOT_STARTED));
        assert!(now <= bond.end_ts, error::invalid_state(E_SALE_ENDED));

        assert!(amount >= bond.min_invest, error::invalid_argument(E_BELOW_MIN));
        assert!(bond.raised + amount <= bond.total_raise, error::invalid_argument(E_OVER_SUBSCRIBE));

        // Withdraw the investment amount from the investor's account
        let coin_amount = coin::withdraw<AptosCoin>(investor, amount);

        let inv_addr = signer::address_of(investor);
        if (!table::contains(&bond.investments, inv_addr)) {
            table::add(&mut bond.investments, inv_addr, amount);
            table::add(&mut bond.claimed, inv_addr, false);
            bond.investor_count = bond.investor_count + 1;
        } else {
            let cur = table::borrow_mut(&mut bond.investments, inv_addr);
            *cur = *cur + amount;
        };

        coin::merge(&mut bond.principal_vault, coin_amount);
        bond.raised = bond.raised + amount;

        // Emit event using the new approach
        event::emit(
            InvestEvent { id: bond.id, investor: inv_addr, amount: amount, raised_after: bond.raised }
        );
    }

    public entry fun redeem(
        investor: &signer,
        bond_owner_addr: address,
        bond_id: u64,
    ) acquires BondStore {
        let store = borrow_global_mut<BondStore>(bond_owner_addr);
        assert!(table::contains(&store.bonds, bond_id), error::not_found(E_BOND_NOT_FOUND));
        let bond = table::borrow_mut(&mut store.bonds, bond_id);

        let inv_addr = signer::address_of(investor);
        assert!(table::contains(&bond.investments, inv_addr), error::not_found(E_NO_INVESTMENT));
        assert!(!table::contains(&bond.claimed, inv_addr) || !*table::borrow(&bond.claimed, inv_addr), error::invalid_state(E_ALREADY_CLAIMED));

        let now = timestamp::now_seconds();
        assert!(now > bond.end_ts, error::invalid_state(E_NOT_MATURED));

        let principal = *table::borrow(&bond.investments, inv_addr);
        let interest = calc_investor_interest(principal, bond.rate_bps, bond.start_ts, bond.end_ts);

        let principal_coin = coin::extract(&mut bond.principal_vault, principal);
        let interest_coin = coin::extract(&mut bond.interest_vault, interest);

        coin::deposit(inv_addr, principal_coin);
        coin::deposit(inv_addr, interest_coin);

        *table::borrow_mut(&mut bond.claimed, inv_addr) = true;
        bond.redeemed_count = bond.redeemed_count + 1;

        // Emit event using the new approach
        event::emit(
            RedeemEvent { id: bond.id, investor: inv_addr, principal, interest }
        );
    }

    public entry fun cancel_bond(
        issuer: &signer,
        bond_id: u64,
    ) acquires BondStore {
        let addr = signer::address_of(issuer);
        let store = borrow_global_mut<BondStore>(addr);
        assert!(table::contains(&store.bonds, bond_id), error::not_found(E_BOND_NOT_FOUND));
        let bond = table::borrow_mut(&mut store.bonds, bond_id);

        assert!(addr == bond.issuer, error::permission_denied(E_NOT_ISSUER));
        assert!(!bond.canceled, error::invalid_state(E_CANNOT_CANCEL));
        assert!(bond.raised == 0, error::invalid_state(E_CANNOT_CANCEL));

        let interest = coin::extract_all(&mut bond.interest_vault);
        coin::deposit(addr, interest);

        bond.canceled = true;

        // Emit event using the new approach
        event::emit(CancelEvent { id: bond.id });
    }

    public entry fun close_bond(
        issuer: &signer,
        bond_id: u64,
    ) acquires BondStore {
        let addr = signer::address_of(issuer);
        let store = borrow_global_mut<BondStore>(addr);
        assert!(table::contains(&store.bonds, bond_id), error::not_found(E_BOND_NOT_FOUND));
        let bond = table::borrow_mut(&mut store.bonds, bond_id);

        assert!(addr == bond.issuer, error::permission_denied(E_NOT_ISSUER));
        assert!(!bond.canceled, error::invalid_state(E_CANNOT_CANCEL));
        assert!(bond.redeemed_count == bond.investor_count, error::invalid_state(E_NOT_ALL_CLAIMED));

        let leftover_interest = coin::value(&bond.interest_vault);
        let interest = coin::extract_all(&mut bond.interest_vault);
        coin::deposit(addr, interest);

        // Emit event using the new approach
        event::emit(
            CloseEvent { id: bond.id, leftover_interest_refunded: leftover_interest }
        );
    }

    // VIEW FUNCTIONS FOR BOND LISTING

    // Get all bonds from a specific bond store
    #[view]
    public fun get_all_bonds(bond_owner_addr: address): vector<BondInfo> acquires BondStore {
        let store = borrow_global<BondStore>(bond_owner_addr);
        let all_bonds = vector::empty<BondInfo>();
        
        let i = 0;
        while (i < store.next_id) {
            if (table::contains(&store.bonds, i)) {
                let bond = table::borrow(&store.bonds, i);
                let bond_info = BondInfo {
                    id: bond.id,
                    issuer: bond.issuer,
                    total_raise: bond.total_raise,
                    rate_bps: bond.rate_bps,
                    start_ts: bond.start_ts,
                    end_ts: bond.end_ts,
                    min_invest: bond.min_invest,
                    raised: bond.raised,
                    canceled: bond.canceled,
                    investor_count: bond.investor_count,
                    company: bond.company,
                    bondId: bond.bondId,
                    question: bond.question,
                    description: bond.description,
                    deadline: bond.deadline,
                    category: bond.category,
                    couponRate: bond.couponRate,
                    maturityDate: bond.maturityDate,
                    principalAmount: bond.principalAmount,
                    creditRating: bond.creditRating,
                };
                vector::push_back(&mut all_bonds, bond_info);
            };
            i = i + 1;
        };
        
        all_bonds
    }

    // Get only active bonds (not canceled, not ended, and still accepting investments)
    #[view]
    public fun get_active_bonds(bond_owner_addr: address): vector<BondInfo> acquires BondStore {
        let store = borrow_global<BondStore>(bond_owner_addr);
        let active_bonds = vector::empty<BondInfo>();
        let now = timestamp::now_seconds();
        
        let i = 0;
        while (i < store.next_id) {
            if (table::contains(&store.bonds, i)) {
                let bond = table::borrow(&store.bonds, i);
                
                // Check if bond is active (not canceled, within investment period, not fully funded)
                if (!bond.canceled && 
                    now >= bond.start_ts && 
                    now <= bond.end_ts && 
                    bond.raised < bond.total_raise) {
                    
                    let bond_info = BondInfo {
                        id: bond.id,
                        issuer: bond.issuer,
                        total_raise: bond.total_raise,
                        rate_bps: bond.rate_bps,
                        start_ts: bond.start_ts,
                        end_ts: bond.end_ts,
                        min_invest: bond.min_invest,
                        raised: bond.raised,
                        canceled: bond.canceled,
                        investor_count: bond.investor_count,
                        company: bond.company,
                        bondId: bond.bondId,
                        question: bond.question,
                        description: bond.description,
                        deadline: bond.deadline,
                        category: bond.category,
                        couponRate: bond.couponRate,
                        maturityDate: bond.maturityDate,
                        principalAmount: bond.principalAmount,
                        creditRating: bond.creditRating,
                    };
                    vector::push_back(&mut active_bonds, bond_info);
                };
            };
            i = i + 1;
        };
        
        active_bonds
    }

    // Get a specific bond by ID
    #[view]
    public fun get_bond_by_id(bond_owner_addr: address, bond_id: u64): BondInfo acquires BondStore {
        let store = borrow_global<BondStore>(bond_owner_addr);
        assert!(table::contains(&store.bonds, bond_id), error::not_found(E_BOND_NOT_FOUND));
        
        let bond = table::borrow(&store.bonds, bond_id);
        BondInfo {
            id: bond.id,
            issuer: bond.issuer,
            total_raise: bond.total_raise,
            rate_bps: bond.rate_bps,
            start_ts: bond.start_ts,
            end_ts: bond.end_ts,
            min_invest: bond.min_invest,
            raised: bond.raised,
            canceled: bond.canceled,
            investor_count: bond.investor_count,
            company: bond.company,
            bondId: bond.bondId,
            question: bond.question,
            description: bond.description,
            deadline: bond.deadline,
            category: bond.category,
            couponRate: bond.couponRate,
            maturityDate: bond.maturityDate,
            principalAmount: bond.principalAmount,
            creditRating: bond.creditRating,
        }
    }

    // Get bonds by category
    #[view]
    public fun get_bonds_by_category(bond_owner_addr: address, category: String): vector<BondInfo> acquires BondStore {
        let store = borrow_global<BondStore>(bond_owner_addr);
        let category_bonds = vector::empty<BondInfo>();
        
        let i = 0;
        while (i < store.next_id) {
            if (table::contains(&store.bonds, i)) {
                let bond = table::borrow(&store.bonds, i);
                
                if (bond.category == category && !bond.canceled) {
                    let bond_info = BondInfo {
                        id: bond.id,
                        issuer: bond.issuer,
                        total_raise: bond.total_raise,
                        rate_bps: bond.rate_bps,
                        start_ts: bond.start_ts,
                        end_ts: bond.end_ts,
                        min_invest: bond.min_invest,
                        raised: bond.raised,
                        canceled: bond.canceled,
                        investor_count: bond.investor_count,
                        company: bond.company,
                        bondId: bond.bondId,
                        question: bond.question,
                        description: bond.description,
                        deadline: bond.deadline,
                        category: bond.category,
                        couponRate: bond.couponRate,
                        maturityDate: bond.maturityDate,
                        principalAmount: bond.principalAmount,
                        creditRating: bond.creditRating,
                    };
                    vector::push_back(&mut category_bonds, bond_info);
                };
            };
            i = i + 1;
        };
        
        category_bonds
    }

    // Get bonds by credit rating
    #[view]
    public fun get_bonds_by_rating(bond_owner_addr: address, credit_rating: String): vector<BondInfo> acquires BondStore {
        let store = borrow_global<BondStore>(bond_owner_addr);
        let rating_bonds = vector::empty<BondInfo>();
        
        let i = 0;
        while (i < store.next_id) {
            if (table::contains(&store.bonds, i)) {
                let bond = table::borrow(&store.bonds, i);
                
                if (bond.creditRating == credit_rating && !bond.canceled) {
                    let bond_info = BondInfo {
                        id: bond.id,
                        issuer: bond.issuer,
                        total_raise: bond.total_raise,
                        rate_bps: bond.rate_bps,
                        start_ts: bond.start_ts,
                        end_ts: bond.end_ts,
                        min_invest: bond.min_invest,
                        raised: bond.raised,
                        canceled: bond.canceled,
                        investor_count: bond.investor_count,
                        company: bond.company,
                        bondId: bond.bondId,
                        question: bond.question,
                        description: bond.description,
                        deadline: bond.deadline,
                        category: bond.category,
                        couponRate: bond.couponRate,
                        maturityDate: bond.maturityDate,
                        principalAmount: bond.principalAmount,
                        creditRating: bond.creditRating,
                    };
                    vector::push_back(&mut rating_bonds, bond_info);
                };
            };
            i = i + 1;
        };
        
        rating_bonds
    }

    // Get matured bonds (ready for redemption)
    #[view]
    public fun get_matured_bonds(bond_owner_addr: address): vector<BondInfo> acquires BondStore {
        let store = borrow_global<BondStore>(bond_owner_addr);
        let matured_bonds = vector::empty<BondInfo>();
        let now = timestamp::now_seconds();
        
        let i = 0;
        while (i < store.next_id) {
            if (table::contains(&store.bonds, i)) {
                let bond = table::borrow(&store.bonds, i);
                
                // Check if bond is matured (past end_ts and not canceled)
                if (!bond.canceled && now > bond.end_ts) {
                    let bond_info = BondInfo {
                        id: bond.id,
                        issuer: bond.issuer,
                        total_raise: bond.total_raise,
                        rate_bps: bond.rate_bps,
                        start_ts: bond.start_ts,
                        end_ts: bond.end_ts,
                        min_invest: bond.min_invest,
                        raised: bond.raised,
                        canceled: bond.canceled,
                        investor_count: bond.investor_count,
                        company: bond.company,
                        bondId: bond.bondId,
                        question: bond.question,
                        description: bond.description,
                        deadline: bond.deadline,
                        category: bond.category,
                        couponRate: bond.couponRate,
                        maturityDate: bond.maturityDate,
                        principalAmount: bond.principalAmount,
                        creditRating: bond.creditRating,
                    };
                    vector::push_back(&mut matured_bonds, bond_info);
                };
            };
            i = i + 1;
        };
        
        matured_bonds
    }

    // Get investment details for a specific investor in a bond
    #[view]
    public fun get_investor_position(
        bond_owner_addr: address, 
        bond_id: u64, 
        investor_addr: address
    ): (u64, bool) acquires BondStore {
        let store = borrow_global<BondStore>(bond_owner_addr);
        assert!(table::contains(&store.bonds, bond_id), error::not_found(E_BOND_NOT_FOUND));
        
        let bond = table::borrow(&store.bonds, bond_id);
        
        if (table::contains(&bond.investments, investor_addr)) {
            let investment_amount = *table::borrow(&bond.investments, investor_addr);
            let claimed = if (table::contains(&bond.claimed, investor_addr)) {
                *table::borrow(&bond.claimed, investor_addr)
            } else {
                false
            };
            (investment_amount, claimed)
        } else {
            (0, false)
        }
    }

    // Get all investments for a specific investor across all bonds
    #[view]
    public fun get_investor_all_positions(
        bond_owner_addr: address,
        investor_addr: address
    ): vector<BondInfo> acquires BondStore {
        let store = borrow_global<BondStore>(bond_owner_addr);
        let investor_bonds = vector::empty<BondInfo>();
        
        let i = 0;
        while (i < store.next_id) {
            if (table::contains(&store.bonds, i)) {
                let bond = table::borrow(&store.bonds, i);
                
                // Check if investor has invested in this bond
                if (table::contains(&bond.investments, investor_addr)) {
                    let bond_info = BondInfo {
                        id: bond.id,
                        issuer: bond.issuer,
                        total_raise: bond.total_raise,
                        rate_bps: bond.rate_bps,
                        start_ts: bond.start_ts,
                        end_ts: bond.end_ts,
                        min_invest: bond.min_invest,
                        raised: bond.raised,
                        canceled: bond.canceled,
                        investor_count: bond.investor_count,
                        company: bond.company,
                        bondId: bond.bondId,
                        question: bond.question,
                        description: bond.description,
                        deadline: bond.deadline,
                        category: bond.category,
                        couponRate: bond.couponRate,
                        maturityDate: bond.maturityDate,
                        principalAmount: bond.principalAmount,
                        creditRating: bond.creditRating,
                    };
                    vector::push_back(&mut investor_bonds, bond_info);
                };
            };
            i = i + 1;
        };
        
        investor_bonds
    }

    // Get total number of bonds
    #[view]
    public fun get_total_bond_count(bond_owner_addr: address): u64 acquires BondStore {
        let store = borrow_global<BondStore>(bond_owner_addr);
        store.next_id
    }

    // Get bond funding progress (percentage funded)
    #[view]
    public fun get_bond_progress(bond_owner_addr: address, bond_id: u64): u64 acquires BondStore {
        let store = borrow_global<BondStore>(bond_owner_addr);
        assert!(table::contains(&store.bonds, bond_id), error::not_found(E_BOND_NOT_FOUND));
        
        let bond = table::borrow(&store.bonds, bond_id);
        if (bond.total_raise == 0) {
            0
        } else {
            (bond.raised * 100) / bond.total_raise
        }
    }

    // Calculate potential interest for an investment amount
    #[view]
    public fun calculate_potential_interest(
        bond_owner_addr: address,
        bond_id: u64,
        investment_amount: u64
    ): u64 acquires BondStore {
        let store = borrow_global<BondStore>(bond_owner_addr);
        assert!(table::contains(&store.bonds, bond_id), error::not_found(E_BOND_NOT_FOUND));
        
        let bond = table::borrow(&store.bonds, bond_id);
        calc_investor_interest(investment_amount, bond.rate_bps, bond.start_ts, bond.end_ts)
    }
}