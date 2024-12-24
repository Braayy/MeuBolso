/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                "june-bud": "#BDD358",
                "june-bud-darken": "#aabf50",
            },

            keyframes: {
                "fadein": {
                    "from": { opacity: "0" },
                    "to": { opacity: "1" },
                },
                "fadeout": {
                    "from": { opacity: "1" },
                    "to": { opacity: "0" },
                }
            },

            animation: {
                "fadein": "fadein 0.2s linear",
                "fadeout": "fadeout 0.2s linear",
            },
        },
    },
    plugins: [],
}

