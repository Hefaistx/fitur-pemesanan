import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: '#00A2EA',
        'primary-08': '#00A2EA80',
        'primary-05': '#00A2EA50',
        'primary-02': '#00A2EA20',
        'primary-01': 'rgba(0,162,234,0.05)',
        secondary: '#00BEED',
        'secondary-light': '#e5f6fd',
        third: '#3A4856',
        black: '#2E353D',
        'black-01': '#2E353D90',
        grey: '#DDE5E9',
        'text-primary': '#2E353D',
        'text-secondary': '#BFBFBF',
        background: '#f2f2f2',
        danger: '#F03837',
        success: '#188D43',
        warning: '#F4C81C',
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
      },
      maxWidth: {
        mobile: '430px',
      },
    },
  },
  plugins: [],
};

export default config;
