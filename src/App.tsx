import { ContentWarning } from './components/screens/ContentWarning';
import { EndingScreen } from './components/screens/EndingScreen';
import { GameScreen } from './components/screens/GameScreen';
import { TitleScreen } from './components/screens/TitleScreen';
import { GameProvider, useGame } from './state/GameContext';

function Screens() {
  const { state } = useGame();
  return (
    <div className="stage-frame">
      <div className="stage">
        {state.screen === 'title' && <TitleScreen />}
        {state.screen === 'warning' && <ContentWarning />}
        {state.screen === 'game' && <GameScreen />}
        {state.screen === 'ending' && <EndingScreen />}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <GameProvider>
      <Screens />
    </GameProvider>
  );
}
