
import React from 'react';

export enum Screen {
  SPLASH,
  HOME,
  PLAYING,
  GAME_OVER,
  PROFILE_SELECTION,
  PROFILE_PAGE,
  SETTINGS,
}

export interface CritterType {
  id: number;
  x: number;
  y: number;
  color: string;
}

export interface Milestone {
  id:string;
  title: string;
  description: string;
  gameId: string;
  condition: {
    type: 'score' | 'played' | 'score_under';
    value: number;
  };
  icon: React.ReactNode;
}

export interface Profile {
  id: string;
  name: string;
  avatar: string; // key for AVATAR_MAP
  unlockedTrophies: string[];
}

export interface ScoreEntry {
  game: string;
  score: number;
  date: number;
  profileId: string;
}

export interface TourStep {
  target: string;
  title:string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export type AgeGroup = '2-4' | '5-7' | '8+';
export type AgeGroupFilter = 'All' | AgeGroup;

export interface Game {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    enabled: boolean;
    ageGroup: AgeGroup;
    category: 'score' | 'sandbox';
}