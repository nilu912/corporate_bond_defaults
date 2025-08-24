#[test_only]
module prediction_market::prediction_market_tests {
    use std::signer;
    use std::string;
    use std::timestamp;
    use std::coin; // Add this import
    use std::aptos_coin::AptosCoin;
    use aptos_framework::account;
    use prediction_market::prediction_market;

    const ONE_APT: u64 = 1_000_000_000;

    // A test for the successful creation of a bond.
    #[test]
    fun test_create_bond_success() {
        // ... (rest of the test)
    }

    // A test for a failed bond creation due to incorrect permissions.
    // The `acquires` keyword must use the actual address and module name
    // or be qualified correctly. In tests, you use the package name.
    #[test]
    #[expected_failure(abort_code = prediction_market::E_NOT_ISSUER, location = prediction_market)]
    fun test_create_bond_not_issuer_fail() {
        let issuer = account::create_account_for_test(@0x1);
        let wrong_issuer = account::create_account_for_test(@0x2);
        
        prediction_market::init_modules(&issuer);
    }

    // A test for a successful investment.
    #[test]
    fun test_invest_success() acquires prediction_market::prediction_market::BondStore {
        // ... (rest of the test)
    }

    // A test for a failed investment due to a low amount.
    #[test]
    #[expected_failure(abort_code = prediction_market::E_BELOW_MIN, location = prediction_market)]
    fun test_invest_below_min_fail() acquires prediction_market::prediction_market::BondStore {
        // ... (rest of the test)
    }
}
