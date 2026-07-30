/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#E8F0FA',
                    100: '#C5D9F0',
                    200: '#9BBDE3',
                    300: '#6E9FD4',
                    400: '#0062B1',
                    500: '#004B87',
                    600: '#003A6B',
                    700: '#002D54',
                    800: '#001F3D',
                    900: '#001226',
                    950: '#000A16',
                },
                logday: {
                    blue: '#004B87',
                    red: '#D91424',
                },
            },
        },
    },
    plugins: [],
}
