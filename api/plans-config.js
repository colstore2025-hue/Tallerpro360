// api/plans-config.js
export const PLANS_CONFIG = {
    basico: {
        name: "Plan Básico",
        prices: {
            "1": 49900,
            "3": 134700, // 10% OFF incluido
            "6": 239500, // 20% OFF incluido
            "12": 419000 // 30% OFF incluido
        }
    },
    pro: {
        name: "Plan Pro",
        prices: {
            "1": 79900,
            "3": 215700,
            "6": 383500,
            "12": 671000
        }
    },
    elite: {
        name: "Plan Élite",
        prices: {
            "1": 129000,
            "3": 348300,
            "6": 619200,
            "12": 1083600
        }
    }
};
