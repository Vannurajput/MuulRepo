import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Screen, ScoreEntry, TourStep, Profile, Game, Milestone } from './types';
import GameOverScreen from './components/GameOverScreen';
import SplashScreen from './components/SplashScreen';
import HomeScreen from './components/HomeScreen';
import ScoreboardScreen from './components/ScoreboardScreen';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import RatingModal from './components/RatingModal';
import TourGuide from './components/TourGuide';
import ProfileSelectionScreen from './components/ProfileSelectionScreen';
import ProfileModal from './components/ProfileModal';
import { HelpIcon } from './components/icons/HelpIcon';
import CritterCatcherGame from './components/games/CritterCatcherGame';
import TicTacToeGame from './components/games/TicTacToeGame';
import NumberBuddiesGame from './components/games/NumberBuddiesGame';
import MemoryMatchGame from './components/games/MemoryMatchGame';
import SnakeGame from './components/games/SnakeGame';
import ColorMatchGame from './components/games/ColorMatchGame';
import MathSafariGame from './components/games/MathSafariGame';
import PatternPalsGame from './components/games/PatternPalsGame';
import WhatsThatSoundGame from './components/games/WhatsThatSoundGame';
import CountTheStarsGame from './components/games/CountTheStarsGame';
import AlphabetTraceGame from './components/games/AlphabetTraceGame';
import ShapeMatchGame from './components/games/ShapeMatchGame';
import ConnectTheDotsGame from './components/games/ConnectTheDotsGame';
import BubbleShooterGame from './components/games/BubbleSortGame';
import ShellGame from './components/games/ShellGame';
import NumberPuzzleGame from './components/games/NumberPuzzleGame';
import WordFinderGame from './components/games/WordFinderGame';
import BlockGame from './components/games/BlockGame';
import FruitCatcherGame from './components/games/FruitCatcherGame';
import SudokuKidsGame from './components/games/SudokuKidsGame';
import GameWrapper from './components/GameWrapper';
import HelpModal from './components/HelpModal';
import TrophyModal from './components/TrophyModal';
import { ALL_MILESTONES } from './milestones';
import SettingsScreen from './components/SettingsScreen';
import useAudio, { audioControls } from './useAudio';

// Import all icons for games list
import { CritterIcon } from './components/icons/CritterIcon';
import { NumberMergeIcon } from './components/icons/NumberMergeIcon';
import { TicTacToeIcon } from './components/icons/TicTacToeIcon';
import { MemoryMatchIcon } from './components/icons/MemoryMatchIcon';
import { SnakeIcon } from './components/icons/SnakeIcon';
import { ColorMatchIcon } from './components/icons/ColorMatchIcon';
import { MathSafariIcon } from './components/icons/MathSafariIcon';
import { PatternPalsIcon } from './components/icons/PatternPalsIcon';
import { SoundGuessIcon } from './components/icons/SoundGuessIcon';
import { CountStarsIcon } from './components/icons/CountStarsIcon';
import { AlphabetTraceIcon } from './components/icons/AlphabetTraceIcon';
import { ShapeMatchIcon } from './components/icons/ShapeMatchIcon';
import { ConnectDotsIcon } from './components/icons/ConnectDotsIcon';
import { BubbleSortIcon } from './components/icons/BubbleSortIcon';
import { ShellGameIcon } from './components/icons/ShellGameIcon';
import { NumberPuzzleIcon } from './components/icons/NumberPuzzleIcon';
import { WordFinderIcon } from './components/icons/WordFinderIcon';
import { BlockGameIcon } from './components/icons/BlockGameIcon';
import { FruitCatcherIcon } from './components/icons/FruitCatcherIcon';
import { SudokuKidsIcon } from './components/icons/SudokuKidsIcon';

const ALL_GAMES: Game[] = [
  { id: 'critter-catcher', title: 'Critter Catcher', description: 'Tap the critters fast!', icon: <CritterIcon />, enabled: true, ageGroup: '5-7', category: 'score' },
  { id: 'fruit-catcher', title: 'Fruit Catcher', description: 'Catch the fruit, avoid the critters!', icon: <FruitCatcherIcon />, enabled: true, ageGroup: '2-4', category: 'score' },
  { id: 'sudoku-kids', title: 'Sudoku Kids', description: 'Solve puzzles with colors instead of numbers!', icon: <SudokuKidsIcon />, enabled: true, ageGroup: '5-7', category: 'sandbox' },
  { id: 'shell-game', title: 'Shell Game', description: 'Follow the ball and guess the cup!', icon: <ShellGameIcon />, enabled: true, ageGroup: '8+', category: 'score' },
  { id: 'word-finder', title: 'Word Finder', description: 'Find words in a grid of letters.', icon: <WordFinderIcon />, enabled: true, ageGroup: '8+', category: 'score' },
  { id: 'tic-tac-toe', title: 'Tic-Tac-Toe', description: 'Classic 3x3 grid game for two players.', icon: <TicTacToeIcon />, enabled: true, ageGroup: '5-7', category: 'sandbox' },
  { id: 'number-buddies', title: 'Number Buddies', description: 'Drop and merge numbered circles.', icon: <NumberMergeIcon />, enabled: true, ageGroup: '8+', category: 'score' },
  { id: 'memory-match', title: 'Memory Match', description: 'Find all the pairs with 3D card flips.', icon: <MemoryMatchIcon />, enabled: true, ageGroup: '5-7', category: 'score' },
  { id: 'snake', title: 'Snake', description: 'Classic game on a 20x20 grid.', icon: <SnakeIcon />, enabled: true, ageGroup: '5-7', category: 'score' },
  { id: 'color-match', title: 'Color Match', description: 'Match the color name to the button.', icon: <ColorMatchIcon />, enabled: true, ageGroup: '2-4', category: 'score' },
  { id: 'math-safari', title: 'Math Safari', description: 'A simple math quiz for kids.', icon: <MathSafariIcon />, enabled: true, ageGroup: '5-7', category: 'score' },
  { id: 'pattern-pals', title: 'Pattern Pals', description: 'Complete the visual pattern of shapes.', icon: <PatternPalsIcon />, enabled: true, ageGroup: '2-4', category: 'score' },
  { id: 'whats-that-sound', title: 'What\'s That Sound?', description: 'Guess the animal from the sound description.', icon: <SoundGuessIcon />, enabled: true, ageGroup: '2-4', category: 'score' },
  { id: 'count-the-stars', title: 'Count the Stars', description: 'Count the stars that appear on screen.', icon: <CountStarsIcon />, enabled: true, ageGroup: '2-4', category: 'score' },
  { id: 'alphabet-trace', title: 'Alphabet Trace', description: 'Trace letters on an HTML5 canvas.', icon: <AlphabetTraceIcon />, enabled: true, ageGroup: '2-4', category: 'sandbox' },
  { id: 'shape-match', title: 'Shape Match', description: 'Match a shape name to the correct shape.', icon: <ShapeMatchIcon />, enabled: true, ageGroup: '2-4', category: 'score' },
  { id: 'connect-the-dots', title: 'Connect the Dots', description: 'Click dots in sequence to reveal a picture.', icon: <ConnectDotsIcon />, enabled: true, ageGroup: '5-7', category: 'score' },
  { id: 'bubble-shooter', title: 'Bubble Shooter', description: 'Clear the board by matching 3 or more bubbles!', icon: <BubbleSortIcon />, enabled: true, ageGroup: '8+', category: 'score' },
  { id: 'number-puzzle', title: 'Number Puzzle', description: 'Slide the tiles to arrange them in order.', icon: <NumberPuzzleIcon />, enabled: true, ageGroup: '8+', category: 'score' },
  { id: 'block-game', title: 'Block Game', description: 'Stack the falling blocks and clear lines!', icon: <BlockGameIcon />, enabled: true, ageGroup: '8+', category: 'score' },
];

const gameComponents: { [key: string]: React.FC<any> } = {
  'critter-catcher': CritterCatcherGame,
  'fruit-catcher': FruitCatcherGame,
  'sudoku-kids': SudokuKidsGame,
  'shell-game': ShellGame,
  'word-finder': WordFinderGame,
  'number-buddies': NumberBuddiesGame,
  'tic-tac-toe': TicTacToeGame,
  'memory-match': MemoryMatchGame,
  'snake': SnakeGame,
  'color-match': ColorMatchGame,
  'math-safari': MathSafariGame,
  'pattern-pals': PatternPalsGame,
  'whats-that-sound': WhatsThatSoundGame,
  'count-the-stars': CountTheStarsGame,
  'alphabet-trace': AlphabetTraceGame,
  'shape-match': ShapeMatchGame,
  'connect-the-dots': ConnectTheDotsGame,
  'bubble-shooter': BubbleShooterGame,
  'number-puzzle': NumberPuzzleGame,
  'block-game': BlockGame,
};

const tourSteps: TourStep[] = [
    {
      target: '#tour-menu-button',
      title: 'Open the Menu',
      content: 'Click here to find navigation links, sound controls, and other options in the sidebar.',
      position: 'bottom',
    },
    {
      target: '#tour-trophy-button',
      title: 'View Your Profile',
      content: 'See your best scores and track your trophies on your Profile Page.',
      position: 'bottom',
    },
    {
      target: '#tour-search-bar',
      title: 'Find a Game',
      content: 'Quickly search for any game by typing its name here.',
      position: 'bottom',
    },
    {
      target: '#tour-game-card',
      title: 'Play a Game',
      content: 'Click the "Play" button on a game card to jump right into the action!',
      position: 'top',
    },
];

export default function App(): React.ReactNode {
  const [screen, setScreen] = useState<Screen>(Screen.SPLASH);
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [lastScore, setLastScore] = useState(0);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [isTourActive, setIsTourActive] = useState(false);
  const [tourStepIndex, setTourStepIndex] = useState(0);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [newlyUnlockedTrophy, setNewlyUnlockedTrophy] = useState<Milestone | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Audio state
  const { setMuted } = useAudio();
  const [isMuted, setIsMuted] = useState(false);

  // Connects the component's mute state to the audio manager
  useEffect(() => {
    setMuted(isMuted);
  }, [isMuted, setMuted]);

  // Manages playing and pausing background music based on the current screen and mute state.
  useEffect(() => {
    if (screen === Screen.HOME && !isMuted) {
      audioControls.playMusic();
    } else {
      audioControls.pauseMusic();
    }
  }, [screen, isMuted]);

  // New Profile State
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Load profiles on initial mount
  useEffect(() => {
    try {
      const storedProfiles = JSON.parse(localStorage.getItem('profiles') || '[]') as Profile[];
      // Backward compatibility for profiles without trophies array
      const profilesWithTrophies = storedProfiles.map(p => ({...p, unlockedTrophies: p.unlockedTrophies || []}));
      const activeProfileId = localStorage.getItem('activeProfileId');
      setProfiles(profilesWithTrophies);

      if (activeProfileId) {
        const profile = profilesWithTrophies.find(p => p.id === activeProfileId);
        if (profile) {
          setActiveProfile(profile);
        }
      }
    } catch (e) {
      console.error("Failed to load profile data", e);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    if (!activeProfile) {
        setScreen(Screen.PROFILE_SELECTION);
    } else {
        const splashTimeout = setTimeout(() => {
          setScreen(Screen.HOME);
        }, 2500);
        return () => clearTimeout(splashTimeout);
    }
  }, [activeProfile, isLoaded]);

  const handleCreateProfile = (name: string, avatar: string) => {
    const newProfile: Profile = { id: Date.now().toString(), name, avatar, unlockedTrophies: [] };
    const updatedProfiles = [...profiles, newProfile];
    setProfiles(updatedProfiles);
    localStorage.setItem('profiles', JSON.stringify(updatedProfiles));
    
    // Set the new profile as active and go directly to the home screen,
    // bypassing the splash screen for a faster entry for new users.
    setActiveProfile(newProfile);
    localStorage.setItem('activeProfileId', newProfile.id);
    setScreen(Screen.HOME);
  };
  
  const handleSelectProfile = (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    if (profile) {
      setActiveProfile(profile);
      localStorage.setItem('activeProfileId', profile.id);
      setScreen(Screen.SPLASH); // Go to splash then home
    }
  };
  
  const handleLogout = () => {
      setActiveProfile(null);
      localStorage.removeItem('activeProfileId');
      setScreen(Screen.PROFILE_SELECTION);
  };
  
  const handleUpdateProfile = (profileId: string, name: string, avatar: string) => {
    const updatedProfiles = profiles.map(p => 
      p.id === profileId ? { ...p, name, avatar } : p
    );
    setProfiles(updatedProfiles);
    localStorage.setItem('profiles', JSON.stringify(updatedProfiles));

    if (activeProfile?.id === profileId) {
      setActiveProfile(prev => prev ? { ...prev, name, avatar } : null);
    }
  };

  const handleDeleteProfile = (profileId: string) => {
    const updatedProfiles = profiles.filter(p => p.id !== profileId);
    setProfiles(updatedProfiles);
    localStorage.setItem('profiles', JSON.stringify(updatedProfiles));

    // Also remove scores associated with the deleted profile
    try {
      const allScores: ScoreEntry[] = JSON.parse(localStorage.getItem('scores') || '[]');
      const remainingScores = allScores.filter(score => score.profileId !== profileId);
      localStorage.setItem('scores', JSON.stringify(remainingScores));
    } catch (e) {
      console.error("Failed to remove scores for deleted profile:", e);
    }

    if (activeProfile?.id === profileId) {
      handleLogout();
    }
  };

  const startGame = useCallback((gameId: string) => {
    audioControls.playWinSound();
    setActiveGameId(gameId);
    setScreen(Screen.PLAYING);
  }, []);

  const saveScore = (game: string, score: number, profileId: string) => {
    if (score <= 0 || !profileId) return;
    try {
      const existingScores: ScoreEntry[] = JSON.parse(localStorage.getItem('scores') || '[]');
      const newScore: ScoreEntry = { game, score, date: Date.now(), profileId };
      const updatedScores = [...existingScores, newScore].sort((a,b) => b.score - a.score);
      localStorage.setItem('scores', JSON.stringify(updatedScores));
    } catch (error) {
      console.error("Failed to save score:", error);
    }
  };
  
  const checkForNewTrophies = (gameId: string, score: number) => {
    if (!activeProfile) return;

    const newlyEarned: Milestone[] = [];
    for (const milestone of ALL_MILESTONES) {
        if (milestone.gameId === gameId && !activeProfile.unlockedTrophies.includes(milestone.id)) {
            let conditionMet = false;
            switch(milestone.condition.type) {
                case 'score':
                    if (score >= milestone.condition.value) conditionMet = true;
                    break;
                case 'score_under':
                    if (score <= milestone.condition.value) conditionMet = true;
                    break;
                case 'played':
                    conditionMet = true; // Just playing the game is enough
                    break;
            }

            if(conditionMet) {
                newlyEarned.push(milestone);
            }
        }
    }
    
    if (newlyEarned.length > 0) {
        const newTrophyIds = newlyEarned.map(t => t.id);
        const updatedProfile = {
            ...activeProfile,
            unlockedTrophies: [...activeProfile.unlockedTrophies, ...newTrophyIds],
        };
        setActiveProfile(updatedProfile);

        const updatedProfiles = profiles.map(p => p.id === updatedProfile.id ? updatedProfile : p);
        setProfiles(updatedProfiles);
        localStorage.setItem('profiles', JSON.stringify(updatedProfiles));
        
        // Show the modal for the first unlocked trophy
        setNewlyUnlockedTrophy(newlyEarned[0]);
    }
  };

  const goHome = useCallback(() => {
    setActiveGameId(null);
    setScreen(Screen.HOME);
  }, []);

  const endGame = useCallback((score: number, gameId: string) => {
    // A score of -1 is a special signal to exit to home without saving a score.
    if (score === -1) {
        goHome();
        return;
    }
      
    if (activeProfile) {
      const game = ALL_GAMES.find(g => g.id === gameId);
      if (!game) return;

      if (game.category === 'score') {
          setLastScore(score);
          saveScore(game.title, score, activeProfile.id);
      }
      
      checkForNewTrophies(gameId, score);

      if (game.category === 'score') {
        setScreen(Screen.GAME_OVER);
      }
    }
  }, [activeProfile, profiles, goHome]);

  const showProfilePage = useCallback(() => setScreen(Screen.PROFILE_PAGE), []);
  const showSettings = useCallback(() => setScreen(Screen.SETTINGS), []);

  const startTour = () => {
    setScreen(Screen.HOME); // Ensure tour starts on the right screen
    setTourStepIndex(0);
    setIsTourActive(true);
  };

  const handleStartTourFromModal = () => {
    setShowHelpModal(false);
    startTour();
  }

  const closeTour = () => setIsTourActive(false);
  const nextTourStep = () => {
    if (tourStepIndex < tourSteps.length - 1) {
      setTourStepIndex(i => i + 1);
    } else {
      closeTour();
    }
  };
  const prevTourStep = () => setTourStepIndex(i => Math.max(0, i - 1));
  
  const ActiveGameComponent = activeGameId ? gameComponents[activeGameId] : null;
  const activeGame = activeGameId ? ALL_GAMES.find(g => g.id === activeGameId) : null;

  const renderScreen = () => {
    if (!isLoaded) return <SplashScreen />; // Show splash while loading profiles
    if (!activeProfile) {
      return <ProfileSelectionScreen 
        profiles={profiles} 
        onProfileSelected={handleSelectProfile} 
        onProfileCreated={handleCreateProfile}
        onProfileUpdated={handleUpdateProfile}
        onProfileDeleted={handleDeleteProfile}
      />;
    }

    switch (screen) {
      case Screen.SPLASH:
        return <SplashScreen />;
      case Screen.PROFILE_SELECTION:
         return <ProfileSelectionScreen 
            profiles={profiles} 
            onProfileSelected={handleSelectProfile} 
            onProfileCreated={handleCreateProfile}
            onProfileUpdated={handleUpdateProfile}
            onProfileDeleted={handleDeleteProfile}
         />;
      case Screen.HOME:
        return <HomeScreen onStartGame={startGame} games={ALL_GAMES} />;
      case Screen.PLAYING:
        return ActiveGameComponent && activeGame ? (
          <GameWrapper onGoHome={goHome} game={activeGame} onGameOver={endGame}>
            <ActiveGameComponent onGameOver={(score: number, gameId?: string) => endGame(score, gameId || activeGame.id)} />
          </GameWrapper>
        ) : <HomeScreen onStartGame={startGame} games={ALL_GAMES} />;
      case Screen.GAME_OVER:
        return <GameOverScreen score={lastScore} onRestart={() => activeGameId && startGame(activeGameId)} onGoHome={goHome} />;
      case Screen.PROFILE_PAGE:
        return <ScoreboardScreen onBack={goHome} activeProfile={activeProfile} allGames={ALL_GAMES} allMilestones={ALL_MILESTONES} />;
      case Screen.SETTINGS:
        return <SettingsScreen onBack={goHome} />;
      default:
        return <HomeScreen onStartGame={startGame} games={ALL_GAMES} />;
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden font-sans select-none text-slate-100">
      <Header 
        onToggleSidebar={() => setShowSidebar(true)} 
        onToggleProfileModal={() => setShowProfileModal(p => !p)}
        isVisible={screen !== Screen.SPLASH && screen !== Screen.PLAYING && screen !== Screen.GAME_OVER && screen !== Screen.PROFILE_SELECTION} 
        activeProfile={activeProfile}
      />
      
      {activeProfile && <Sidebar 
        isOpen={showSidebar} 
        onClose={() => setShowSidebar(false)}
        onShowHome={goHome}
        onShowRating={() => setShowRating(true)}
        onShowSettings={showSettings}
        isMuted={isMuted}
        onToggleMute={() => setIsMuted(prev => !prev)}
      />}
      
      {isTourActive && (
        <TourGuide 
            steps={tourSteps} 
            stepIndex={tourStepIndex}
            onClose={closeTour}
            onNext={nextTourStep}
            onPrev={prevTourStep}
        />
      )}
      {showRating && <RatingModal onClose={() => setShowRating(false)} />}
      {showHelpModal && <HelpModal onClose={() => setShowHelpModal(false)} onStartTour={handleStartTourFromModal} />}
      {newlyUnlockedTrophy && <TrophyModal trophy={newlyUnlockedTrophy} onClose={() => setNewlyUnlockedTrophy(null)} />}
      {showProfileModal && activeProfile && (
        <ProfileModal
          profile={activeProfile}
          profiles={profiles}
          onClose={() => setShowProfileModal(false)}
          onManageAccount={() => {
            setShowProfileModal(false);
            showProfilePage();
          }}
          onAddAccount={() => {
            setShowProfileModal(false);
            handleLogout();
          }}
          onSwitchProfile={(profileId: string) => {
            setShowProfileModal(false);
            handleSelectProfile(profileId);
          }}
          onSignOut={() => {
            setShowProfileModal(false);
            handleLogout();
          }}
        />
      )}

      <main className="w-full h-full">
        {renderScreen()}
      </main>
      
      {screen === Screen.HOME && !isTourActive && (
         <button onClick={() => setShowHelpModal(true)} className="absolute bottom-6 right-6 bg-slate-800/80 text-cyan-400 border-2 border-cyan-400 rounded-full p-4 shadow-lg shadow-cyan-500/20 animate-bounce hover:animate-none hover:bg-slate-700 hover:border-cyan-300 hover:text-cyan-300 transition-all focus:outline-none focus:ring-4 focus:ring-cyan-300/50">
           <HelpIcon className="w-8 h-8"/>
           <span className="sr-only">Help</span>
         </button>
      )}
    </div>
  );
}