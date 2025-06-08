# Golf Team Competition App

A Vue.js web application for managing golf team competitions. This application helps organizers manage players, form balanced teams, track scores, and display leaderboards.

## Features

- **Player Management**: Add, edit, and delete players with talent ratings and financial information
- **Team Formation**: Create balanced teams manually or automatically using a snake draft algorithm
- **Scoring System**: Enter and track scores for multiple courses
- **Leaderboards**: View team and individual rankings
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Theme Options**: Choose between light and dark themes
- **Data Import/Export**: Backup and restore your competition data

## Installation

### Prerequisites

- Node.js (v14.0.0 or higher)
- npm (v6.0.0 or higher)

### Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/golf-competition-app.git
cd golf-competition-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run serve
```

4. Build for production:
```bash
npm run build
```

## Usage

After starting the development server, open your browser and navigate to `http://localhost:8080` to access the application.

### Quick Start Guide

1. **Add Players**: Navigate to Administration > Players to add players with their talent ratings
2. **Create Teams**: Go to Administration > Teams to create teams and assign players
3. **Enter Scores**: Use the Scoring section to enter scores for each course
4. **View Leaderboards**: Check the Leaderboards section to see team and individual rankings

For detailed instructions, please refer to the [User Guide](./doc/user-guide.md).

## Project Structure

```
golf-competition-app/
├── doc/                    # Documentation files
│   ├── final-delivery.md   # Final delivery documentation
│   ├── test-plan.md        # Test plan
│   └── user-guide.md       # User guide
├── public/                 # Static files
├── src/                    # Source files
│   ├── assets/             # Assets (images, styles)
│   ├── components/         # Vue components
│   │   ├── admin/          # Administration components
│   │   ├── layout/         # Layout components
│   │   ├── scoring/        # Scoring components
│   │   └── shared/         # Shared components
│   ├── router/             # Vue Router configuration
│   ├── services/           # Services for data handling
│   ├── store/              # Vuex store modules
│   │   └── modules/        # Store modules
│   ├── utils/              # Utility functions
│   ├── views/              # Page components
│   ├── App.vue             # Root component
│   └── main.js             # Entry point
├── .gitignore              # Git ignore file
├── package.json            # Package configuration
├── README.md               # Project documentation
└── vue.config.js           # Vue CLI configuration
```

## Technology Stack

- Vue.js 2
- Vue Router for navigation
- Vuex for state management
- CSS Variables for theming
- LocalStorage for data persistence

## Testing

A comprehensive test plan is available in the [Test Plan](./doc/test-plan.md) document.

## Data Persistence

The application uses localStorage for data persistence. All data is stored in the browser's localStorage and can be exported/imported as JSON.

## Browser Compatibility

The application is compatible with the following browsers:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Vue.js team for the excellent framework
- All contributors to the project

