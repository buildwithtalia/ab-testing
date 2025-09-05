# A/B Testing Dashboard

A modern, responsive React application for managing and analyzing A/B tests. Built with TypeScript and featuring comprehensive experiment tracking, statistical analysis, and beautiful visualizations.

## 🚀 Features

### Experiment Management
- ✅ Create and name experiments with detailed descriptions
- ✅ Define multiple variants (A, B, C, etc.) with custom names
- ✅ Assign and validate traffic percentages across variants
- ✅ Auto-balance traffic distribution feature
- ✅ Draft, Running, and Completed experiment states

### Analytics & Results
- 📊 Real-time conversion rate calculations
- 📈 Uplift percentage analysis relative to control
- 🎯 Statistical significance indicators
- 📉 95% confidence intervals
- 📊 Interactive bar charts using Recharts
- 🏆 Automatic winner detection

### Modern UI/UX
- 📱 Fully responsive design for all devices
- 🎨 Clean, professional styling with hover effects
- 🟢 Color-coded status indicators
- 🔧 Form validation with comprehensive error handling
- ⚡ Fast, intuitive navigation

## 🛠️ Technology Stack

- **Frontend**: React 18 with TypeScript
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React
- **Styling**: Custom CSS with utility classes
- **Build Tool**: Create React App

## 🏃‍♂️ Getting Started

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/buildwithtalia/ab-testing.git
cd ab-testing
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The application will open at `http://localhost:3002`

### Available Scripts

- `npm start` - Runs the app in development mode on port 3002
- `npm build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm eject` - Ejects from Create React App (irreversible)

## 📊 Sample Data

The dashboard includes sample experiments to demonstrate all features:

1. **Homepage CTA Button Test** (Running)
   - Testing blue vs red button colors
   - Real-time conversion tracking

2. **Pricing Page Layout** (Completed)
   - Three-variant test with statistical winner
   - Complete results analysis

3. **Email Newsletter Signup** (Draft)
   - Ready to start testing
   - Inline vs modal form comparison

## 🎯 Key Components

### Dashboard
- Overview metrics and KPIs
- Experiment list with quick actions
- Navigation between different views

### Experiment Creation
- Multi-step form with validation
- Dynamic variant management
- Traffic allocation with auto-balancing

### Results Analysis
- Detailed statistical breakdown
- Interactive visualizations
- Winner detection and confidence intervals

## 📈 Statistical Analysis

The dashboard provides:
- Conversion rate calculations
- Uplift analysis relative to control variant
- Simplified statistical significance testing
- 95% confidence intervals
- Winner recommendation based on performance

*Note: For production use, consider implementing more sophisticated statistical testing methods.*

## 🔧 Customization

### Adding New Metrics
Extend the `ExperimentResults` interface in `src/types/experiment.ts` to add custom metrics.

### Styling
Modify `src/index.css` for global styles or individual component files for specific styling.

### Charts
Customize chart appearance and data in the `ExperimentResults` component using Recharts configuration.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙋‍♂️ Support

For questions or issues, please open a GitHub issue or contact the development team.

---

Built with ❤️ using React and TypeScript
