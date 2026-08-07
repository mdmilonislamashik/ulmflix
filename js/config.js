window.ULMFLIX_CONFIG = {
  APP_NAME: "ULMFlix",

  PRODUCTION_ORIGIN: "",

  TMDB_API_KEY: "",
  TMDB_BASE_URL: "https://api.themoviedb.org/3",
  TMDB_IMAGE_URL: "https://image.tmdb.org/t/p/w500",
  TMDB_BACKDROP_URL: "https://image.tmdb.org/t/p/original",
  USE_DEMO_DATA_WITHOUT_API_KEY: true,

  ADSENSE_PUBLISHER_ID: "",
  ADSENSE_ENABLED: false,
  GA_MEASUREMENT_ID: "",

  SUPABASE_URL: "https://wihoiwjognjsaqlitfuz.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_3F4AJQBcLV9TD3FZl8xSpg_FruUa_ck",

  CURRENCY: "USD",

  PLANS: {
    monthly: {
      id: "premium_monthly",
      name: "Premium Monthly",
      amount: 9.99,
      interval: "month"
    },
    yearly: {
      id: "premium_yearly",
      name: "Premium Yearly",
      amount: 49.99,
      interval: "year"
    }
  },

  PAYMENT: {
    provider: "stripe",
    checkoutEndpoint: "/api/create-checkout-session",
    portalEndpoint: "/api/customer-portal",
    donationEndpoint: "/api/create-donation-session"
  }
};

