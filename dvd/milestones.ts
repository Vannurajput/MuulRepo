import React from 'react';
import {
  TrophyBronzeIcon,
  TrophySilverIcon,
  TrophyGoldIcon,
} from './components/icons/TrophyIcons';
import { Milestone } from './types';

export const ALL_MILESTONES: Milestone[] = [
  // Word Finder Milestones
  {
    id: 'word_finder_score_20',
    title: 'Word Scout',
    description: 'Score 20 points in Word Finder.',
    gameId: 'word-finder',
    condition: { type: 'score', value: 20 },
    icon: React.createElement(TrophyBronzeIcon, null),
  },
  {
    id: 'word_finder_score_50',
    title: 'Word Wizard',
    description: 'Score 50 points in Word Finder.',
    gameId: 'word-finder',
    condition: { type: 'score', value: 50 },
    icon: React.createElement(TrophySilverIcon, null),
  },
  {
    id: 'word_finder_score_100',
    title: 'Lexicon Master',
    description: 'Score 100 points in Word Finder.',
    gameId: 'word-finder',
    condition: { type: 'score', value: 100 },
    icon: React.createElement(TrophyGoldIcon, null),
  },

  // Critter Catcher Score Milestones
  {
    id: 'critter_catcher_score_10',
    title: 'Critter Apprentice',
    description: 'Score 10 points in Critter Catcher.',
    gameId: 'critter-catcher',
    condition: { type: 'score', value: 10 },
    icon: React.createElement(TrophyBronzeIcon, null),
  },
  {
    id: 'critter_catcher_score_25',
    title: 'Critter Pro',
    description: 'Score 25 points in Critter Catcher.',
    gameId: 'critter-catcher',
    condition: { type: 'score', value: 25 },
    icon: React.createElement(TrophySilverIcon, null),
  },
  {
    id: 'critter_catcher_score_50',
    title: 'Critter Master',
    description: 'Score 50 points in Critter Catcher.',
    gameId: 'critter-catcher',
    condition: { type: 'score', value: 50 },
    icon: React.createElement(TrophyGoldIcon, null),
  },

  // Fruit Catcher Milestones
  {
    id: 'fruit_catcher_score_100',
    title: 'Fruit Rookie',
    description: 'Score 100 points in Fruit Catcher.',
    gameId: 'fruit-catcher',
    condition: { type: 'score', value: 100 },
    icon: React.createElement(TrophyBronzeIcon, null),
  },
  {
    id: 'fruit_catcher_score_250',
    title: 'Jungle Juicer',
    description: 'Score 250 points in Fruit Catcher.',
    gameId: 'fruit-catcher',
    condition: { type: 'score', value: 250 },
    icon: React.createElement(TrophySilverIcon, null),
  },
  {
    id: 'fruit_catcher_score_500',
    title: 'Fruit Ninja',
    description: 'Score 500 points in Fruit Catcher.',
    gameId: 'fruit-catcher',
    condition: { type: 'score', value: 500 },
    icon: React.createElement(TrophyGoldIcon, null),
  },

  // Memory Match Score Milestones
  {
    id: 'memory_match_score_10',
    title: 'Sharp Memory',
    description: 'Finish Memory Match in 40 moves or less.',
    gameId: 'memory-match',
    condition: { type: 'score', value: 10 }, // 50 - 40 = 10
    icon: React.createElement(TrophyBronzeIcon, null),
  },
  {
    id: 'memory_match_score_20',
    title: 'Photographic Memory',
    description: 'Finish Memory Match in 30 moves or less.',
    gameId: 'memory-match',
    condition: { type: 'score', value: 20 }, // 50 - 30 = 20
    icon: React.createElement(TrophySilverIcon, null),
  },
    
  // Snake Score Milestones
  {
    id: 'snake_score_5',
    title: 'Slithery Start',
    description: 'Score 5 points in Snake.',
    gameId: 'snake',
    condition: { type: 'score', value: 5 },
    icon: React.createElement(TrophyBronzeIcon, null),
  },
  {
    id: 'snake_score_15',
    title: 'Python Power',
    description: 'Score 15 points in Snake.',
    gameId: 'snake',
    condition: { type: 'score', value: 15 },
    icon: React.createElement(TrophySilverIcon, null),
  },

  // Number Buddies Score Milestones
  {
    id: 'number_buddies_score_1000',
    title: 'Buddy Beginner',
    description: 'Score 1,000 points in Number Buddies.',
    gameId: 'number-buddies',
    condition: { type: 'score', value: 1000 },
    icon: React.createElement(TrophyBronzeIcon, null),
  },
  {
    id: 'number_buddies_score_5000',
    title: 'Merge Mayor',
    description: 'Score 5,000 points in Number Buddies.',
    gameId: 'number-buddies',
    condition: { type: 'score', value: 5000 },
    icon: React.createElement(TrophySilverIcon, null),
  },
  {
    id: 'number_buddies_score_10000',
    title: 'Fusion Fanatic',
    description: 'Score 10,000 points in Number Buddies.',
    gameId: 'number-buddies',
    condition: { type: 'score', value: 10000 },
    icon: React.createElement(TrophyGoldIcon, null),
  },
  
  // Color Match Score Milestones
  {
    id: 'color_match_score_10',
    title: 'Hue Hero',
    description: 'Score 10 points in Color Match.',
    gameId: 'color-match',
    condition: { type: 'score', value: 10 },
    icon: React.createElement(TrophyBronzeIcon, null),
  },
  {
    id: 'color_match_score_20',
    title: 'Chroma Champion',
    description: 'Score 20 points in Color Match.',
    gameId: 'color-match',
    condition: { type: 'score', value: 20 },
    icon: React.createElement(TrophySilverIcon, null),
  },

  // Math Safari Score Milestones
  {
    id: 'math_safari_score_50',
    title: 'Math Explorer',
    description: 'Score 50 points in Math Safari.',
    gameId: 'math-safari',
    condition: { type: 'score', value: 50 },
    icon: React.createElement(TrophyBronzeIcon, null),
  },
  {
    id: 'math_safari_score_100',
    title: 'Calculation King',
    description: 'Score 100 points in Math Safari.',
    gameId: 'math-safari',
    condition: { type: 'score', value: 100 },
    icon: React.createElement(TrophySilverIcon, null),
  },

  // Connect The Dots Milestones
  {
    id: 'connect_dots_champion',
    title: 'Master Artist',
    description: 'Complete all of the Connect the Dots puzzles.',
    gameId: 'connect-the-dots',
    condition: { type: 'score', value: 50 }, // 5 levels * 10 points
    icon: React.createElement(TrophyGoldIcon, null),
  },

  // Bubble Shooter Milestones
  {
    id: 'bubble_shooter_score_1000',
    title: 'Bubble Novice',
    description: 'Score 1,000 points in Bubble Shooter.',
    gameId: 'bubble-shooter',
    condition: { type: 'score', value: 1000 },
    icon: React.createElement(TrophyBronzeIcon, null),
  },
  {
    id: 'bubble_shooter_score_5000',
    title: 'Bubble Pro',
    description: 'Score 5,000 points in Bubble Shooter.',
    gameId: 'bubble-shooter',
    condition: { type: 'score', value: 5000 },
    icon: React.createElement(TrophySilverIcon, null),
  },

  // Shell Game Milestones
  {
    id: 'shell_game_score_10',
    title: 'Sharp Eye',
    description: 'Complete level 1 in Shell Game.',
    gameId: 'shell-game',
    condition: { type: 'score', value: 10 },
    icon: React.createElement(TrophyBronzeIcon, null),
  },
  {
    id: 'shell_game_score_20',
    title: 'Cup Conjurer',
    description: 'Complete level 2 in Shell Game.',
    gameId: 'shell-game',
    condition: { type: 'score', value: 20 },
    icon: React.createElement(TrophySilverIcon, null),
  },
  {
    id: 'shell_game_score_40',
    title: 'Shell Master',
    description: 'Complete all levels in Shell Game.',
    gameId: 'shell-game',
    condition: { type: 'score', value: 40 },
    icon: React.createElement(TrophyGoldIcon, null),
  },

  // Number Puzzle Milestones
  {
    id: 'number_puzzle_solved',
    title: 'Puzzle Solver',
    description: 'Solve a Number Puzzle.',
    gameId: 'number-puzzle',
    condition: { type: 'score', value: 1 }, // Any score > 0 means it's solved
    icon: React.createElement(TrophyBronzeIcon, null),
  },
  {
    id: 'number_puzzle_efficient',
    title: 'Efficient Mover',
    description: 'Solve a Number Puzzle in under 100 moves.',
    gameId: 'number-puzzle',
    condition: { type: 'score', value: 400 }, // 500 - 100
    icon: React.createElement(TrophySilverIcon, null),
  },
  {
    id: 'number_puzzle_master',
    title: 'Puzzle Master',
    description: 'Solve a Number Puzzle in under 50 moves.',
    gameId: 'number-puzzle',
    condition: { type: 'score', value: 450 }, // 500 - 50
    icon: React.createElement(TrophyGoldIcon, null),
  },

  // Block Game Milestones
  {
    id: 'block_game_score_1000',
    title: 'Block Builder',
    description: 'Score 1,000 points in Block Game.',
    gameId: 'block-game',
    condition: { type: 'score', value: 1000 },
    icon: React.createElement(TrophyBronzeIcon, null),
  },
  {
    id: 'block_game_score_10000',
    title: 'Tetris Architect',
    description: 'Score 10,000 points in Block Game.',
    gameId: 'block-game',
    condition: { type: 'score', value: 10000 },
    icon: React.createElement(TrophySilverIcon, null),
  },
  {
    id: 'block_game_score_50000',
    title: 'Block Legend',
    description: 'Score 50,000 points in Block Game.',
    gameId: 'block-game',
    condition: { type: 'score', value: 50000 },
    icon: React.createElement(TrophyGoldIcon, null),
  },

  // Sudoku Kids Milestones
  {
    id: 'sudoku_kids_solve_easy',
    title: 'First Steps',
    description: 'Solve a 4x4 Sudoku puzzle.',
    gameId: 'sudoku-kids',
    condition: { type: 'played', value: 1 }, // Any puzzle completion triggers this
    icon: React.createElement(TrophyBronzeIcon, null),
  },
  {
    id: 'sudoku_kids_solve_hard',
    title: 'Puzzle Pro',
    description: 'Solve a 6x6 Sudoku puzzle.',
    gameId: 'sudoku-kids',
    condition: { type: 'score', value: 6 }, // Custom score value for 6x6 completion
    icon: React.createElement(TrophySilverIcon, null),
  },
  {
    id: 'sudoku_kids_no_hints',
    title: 'Brainiac!',
    description: 'Solve any Sudoku without using hints.',
    gameId: 'sudoku-kids',
    condition: { type: 'score', value: 100 }, // Custom score value for no-hint win
    icon: React.createElement(TrophyGoldIcon, null),
  },
];