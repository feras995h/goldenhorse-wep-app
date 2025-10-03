// Simple exchange rate service (stub). Replace with real provider when ready.

class ExchangeRateService {
  static async fetchExchangeRate(fromCurrency, toCurrency, date = new Date()) {
    // TODO: Integrate with external provider (e.g., exchangerate-api)
    const rates = {
      'USD_LYD': 4.85,
      'EUR_LYD': 5.20,
      'CNY_LYD': 0.68,
      'LYD_USD': 0.206,
      'LYD_EUR': 0.192,
      'LYD_CNY': 1.47
    };
    const key = `${String(fromCurrency).toUpperCase()}_${String(toCurrency).toUpperCase()}`;
    return rates[key] || 1.0;
  }

  static async convertAmount(amount, fromCurrency, toCurrency, date = new Date()) {
    if (!amount || fromCurrency === toCurrency) return amount || 0;
    const rate = await this.fetchExchangeRate(fromCurrency, toCurrency, date);
    return (Number(amount) || 0) * (Number(rate) || 1);
  }

  // Placeholder for daily update job
  static async updateRates() {
    // No-op for now; hook for cron job
    return true;
  }
}

export default ExchangeRateService;
