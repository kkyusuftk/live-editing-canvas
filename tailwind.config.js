/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			keyframes: {
				'slide-down-fade': {
					'0%': {
						opacity: '0',
						transform: 'translateX(-50%) translateY(-10px) scale(0.95)',
					},
					'100%': {
						opacity: '1',
						transform: 'translateX(-50%) translateY(0) scale(1)',
					},
				},
			},
			animation: {
				'slide-down-fade': 'slide-down-fade 0.2s ease-out',
			},
		},
	},
	plugins: [],
};
