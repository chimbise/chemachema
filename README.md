# Chemachema

A loan calculation and affordability assessment application.

## About

This application helps users:
- Calculate loan affordability based on various loan types and interest rates
- View detailed loan breakdowns including interest rates, fees, and monthly installments
- Assess different loan options from various providers (Botusafe, Tawu, BPOPF, Metropolitan, etc.)

## Features

- **Loan Calculator**: Calculate monthly installments based on loan amount, interest rate, and term
- **Multiple Loan Types**: Support for various loan providers and interest rate tiers
- **Detailed Breakdown**: View admin fees, processing fees, credit life premium, and collection fees
- **User Authentication**: Phone number verification and user registration
- **PDF Generation**: Generate loan documents using PDF-lib

## Project Structure

```
chemachema/
├── affordability/     # Affordability calculator module
│   ├── aff.html      # Main affordability page
│   ├── aff.js        # Affordability logic
│   └── aff.min.js    # Minified version
├── intro/            # Loan calculator module  
│   ├── intro.html    # Main calculator interface
│   ├── intro.js      # Calculator logic
│   └── intro.min.js  # Minified version
├── img/              # Image assets
└── .github/          # GitHub Actions workflows
```

## Getting Started

### Prerequisites

- Node.js (for running the application)
- Modern web browser

### Installation

```bash
# Clone the repository
git clone https://github.com/chimbise/chemachema.git

# Navigate to the project directory
cd chemachema

# Install dependencies
npm install

# Start the application
npm start
```

## Dependencies

- **Firebase**: Authentication and data storage (`^11.3.1`)
- **PDF-lib**: PDF generation for loan documents (`^1.17.1`)

## Loan Providers Supported

- Botusafe (20% - 32%)
- Tawu (23% - 32%)
- Tawu Para (23% - 32%)
- BPOPF (26% - 32%)
- Metropolitan (23% - 32%)
- Lahisa (26% - 32%)
- Ubassu (26% - 32%)
- Bots Life (26% - 32%)
- Dikgosana (26% - 32%)

## GitHub Billing Information

If you received a charge from GitHub and are unsure about its source, please see our [**BILLING.md**](BILLING.md) guide which explains:
- Common sources of GitHub charges
- How to check your GitHub billing settings
- How to cancel or modify subscriptions
- Contact information for GitHub support

**Note**: A $10 charge is typically from a GitHub Copilot individual subscription.

## Usage

1. Open `intro/intro.html` in a web browser to access the loan calculator
2. Select your loan type and interest rate from the dropdown
3. Enter your desired loan amount
4. View the detailed breakdown of monthly installments and fees
5. Use the phone verification to save your calculations

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

ISC

## Support

For technical issues with this application, please open an issue in the GitHub repository.

For GitHub billing questions, see [BILLING.md](BILLING.md).
