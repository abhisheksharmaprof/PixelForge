/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // You can extend colors here if needed to match Stitch variables if you want to use them in tailwind config
                // But for now, standard tailwind colors + CSS variables are fine.
            }
        },
    },
    plugins: [],
}
