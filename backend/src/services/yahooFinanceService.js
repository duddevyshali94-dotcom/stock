const axios = require('axios');

const YAHOO_QUOTE_URL = 'https://query1.finance.yahoo.com/v7/finance/quote';
const YAHOO_CHART_URL = 'https://query1.finance.yahoo.com/v8/finance/chart';

async function fetchQuotes(symbols = []) {
  if (!symbols.length) {
    return [];
  }

  const { data } = await axios.get(YAHOO_QUOTE_URL, {
    params: {
      symbols: symbols.join(',')
    }
  });

  return data?.quoteResponse?.result || [];
}

async function fetchChart(symbol, range = '1mo', interval = '1d') {
  const { data } = await axios.get(`${YAHOO_CHART_URL}/${encodeURIComponent(symbol)}`, {
    params: {
      range,
      interval,
      includePrePost: false
    }
  });

  const result = data?.chart?.result?.[0];
  if (!result) {
    return null;
  }

  const timestamps = result.timestamp || [];
  const indicators = result.indicators?.quote?.[0];
  if (!indicators) {
    return null;
  }

  return timestamps.map((timestamp, index) => ({
    date: new Date(timestamp * 1000).toISOString().split('T')[0],
    open: indicators.open?.[index],
    high: indicators.high?.[index],
    low: indicators.low?.[index],
    close: indicators.close?.[index],
    volume: indicators.volume?.[index]
  })).filter(point => point.close !== null && point.close !== undefined);
}

module.exports = {
  fetchQuotes,
  fetchChart
};
