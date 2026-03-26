# Golf Competition App - User Guide

## Table of Contents
1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Organization Management](#organization-management)
4. [Player Management](#player-management)
5. [Team Management](#team-management)
6. [Scoring System](#scoring-system)
7. [Leaderboards](#leaderboards)
8. [Settings and Preferences](#settings-and-preferences)
9. [Data Management](#data-management)
10. [Troubleshooting](#troubleshooting)
11. [FAQ](#faq)

## Introduction

Welcome to the Golf Competition App! This application helps you manage golf team competitions by providing tools for player management, team formation, scoring, and leaderboards. This guide will walk you through all the features and functionality of the application.

### Key Features

- **Player Management**: Add, edit, and delete players with talent ratings and financial information
- **Team Management**: Create balanced teams manually or automatically
- **Scoring System**: Enter and track scores for multiple courses
- **Leaderboards**: View team and individual rankings
- **Data Import/Export**: Backup and restore your competition data
- **Theme Options**: Choose between light and dark themes

## Getting Started

### Accessing the Application

The Golf Competition App is a web application that can be accessed through any modern web browser. Simply navigate to the provided URL to start using the application.

### Navigation

The application has a top navigation bar with three main sections:

1. **Administration**: Manage players and teams
2. **Scoring**: Enter scores for different courses
3. **Leaderboards**: View team and individual rankings

The sidebar on the left provides access to specific pages within each section.

## Organization Management

The app supports multiple organizations (tenants), each with their own private competitions, players, teams, and scores. On first use, a **Default** organization is created automatically.

### What is an Organization?

An organization is the top-level container for all your competition data. Think of it as your "golf club" or "group". Each organization has:
- Its own competitions, players, teams, and scores
- A unique name and URL slug
- Complete data isolation from other organizations

### Selecting an Active Organization

The active organization is shown in the header. When only one organization exists, it appears as a badge. When multiple organizations exist, a dropdown selector appears — use it to switch between organizations.

Switching organizations reloads the competition list for the selected organization.

### Managing Organizations

1. Navigate to **Administration > Organizations**
2. From here you can:
   - **Create** a new organization (click "+ New Organization")
   - **Set Active** to switch to a different organization
   - **Edit** an organization's name or slug
   - **Delete** an organization (this permanently deletes ALL its competitions, players, teams, and scores)

> **Note:** The Default organization cannot be deleted.

### Creating an Organization

1. Click "+ New Organization"
2. Enter a name (e.g. "Bathe Golf Club")
3. The URL slug is auto-generated from the name (e.g. `bathe-golf-club`) — you can customize it
4. Click "Save"

### Switching Between Organizations

When you have multiple organizations, use the dropdown in the header to switch. All competition data shown (players, teams, scores, leaderboards) is scoped to the currently active organization.

## Player Management

### Adding a Player

1. Navigate to **Administration > Players**
2. Click the "Add Player" button
3. Fill in the required information:
   - Name
   - Talent Rating (A, B, C, or D)
   - Entry Fee
   - Winnings (if applicable)
4. Click "Add Player" to save

### Editing a Player

1. Find the player in the player list
2. Click the "Edit" button
3. Update the player information
4. Click "Update Player" to save changes

### Deleting a Player

1. Find the player in the player list
2. Click the "Delete" button
3. Confirm the deletion in the confirmation dialog

### Player Statistics

The Player Management page includes a Player Stats section that shows:
- Distribution of talent ratings
- Total entry fees and winnings
- Financial summary

## Team Management

### Creating a Team

1. Navigate to **Administration > Teams**
2. Click the "Add Team" button
3. Enter the team name and optional logo URL
4. Click "Add Team" to save

### Generating Balanced Teams

1. Navigate to **Administration > Teams**
2. Click the "Generate Teams" button
3. Enter the number of teams to generate
4. Click "Generate" to create balanced teams based on player talent ratings

### Assigning Players to Teams

1. Navigate to **Administration > Teams**
2. Scroll down to the Player Assignment section
3. Select a player from the list
4. Choose a team from the dropdown
5. Click "Assign" to add the player to the team

### Team Balance Analysis

The Team Management page includes a Team Balance Analyzer that shows:
- Overall team balance
- Player distribution
- Talent distribution
- Comparative chart of talent distribution by team

## Scoring System

### Entering Scores

1. Navigate to **Scoring** and select a course
2. Find the player in the score entry table
3. Enter the score in the input field
4. Click "Save" to record the score

### Updating Scores

1. Navigate to **Scoring** and select a course
2. Find the player with the existing score
3. Update the score in the input field
4. Click "Save" to update the score

### Clearing Scores

1. Navigate to **Scoring** and select a course
2. Find the player with the existing score
3. Click "Clear" to remove the score

### Viewing Course Scorecards

Each course page includes a Course Scorecard section that shows:
- Team-based scorecards
- Individual player scores within each team
- Team totals for the course

## Leaderboards

### Team Leaderboard

The Team Leaderboard shows:
- Ranking of teams based on total scores
- Scores for each course
- Team totals

### Player Leaderboard

The Player Leaderboard shows:
- Ranking of players based on individual scores
- Scores for each course
- Player totals

You can filter the Player Leaderboard by:
- Team
- Talent Rating

### Competition Summary

The Leaderboards page includes a Competition Summary section that shows:
- Number of teams, players, and courses
- Total scores recorded
- Financial summary including entry fees, winnings, and balance

## Settings and Preferences

### Theme Options

You can toggle between light and dark themes by clicking the sun/moon icon in the top navigation bar.

## Data Management

### Exporting Data

1. Click the download icon in the top navigation bar
2. Click "Export Data" in the modal
3. The data will be downloaded as a JSON file

### Importing Data

1. Click the upload icon in the top navigation bar
2. Paste your JSON data into the text area
3. Click "Import Data"
4. The page will refresh with the imported data

## Troubleshooting

### Common Issues

#### Scores Not Saving
- Ensure the score is within the valid range (18-150)
- Check for any validation errors

#### Teams Not Generating
- Ensure there are enough players with talent ratings assigned
- Try creating teams manually if automatic generation fails

#### Data Import Errors
- Verify the JSON format is correct
- Ensure all required fields are present in the import data

## FAQ

### How are team rankings calculated?
Team rankings are based on the total scores of all team members across all courses. Lower scores are better.

### How does the automatic team generation work?
The automatic team generation uses a snake draft algorithm to ensure balanced distribution of talent across teams. Players are sorted by talent rating and then assigned to teams in a snake pattern.

### Can I delete a course?
Courses are predefined in the application and cannot be deleted. However, you can clear all scores for a course.

### What happens to player scores when I delete a player?
When you delete a player, all their scores are also deleted from the system.

### Can I export only specific data (e.g., just players or teams)?
Currently, the export function exports all data. You cannot export only specific parts of the data.

### Is my data saved automatically?
Yes, all changes are automatically saved to your browser's localStorage. However, it's recommended to export your data periodically as a backup.

