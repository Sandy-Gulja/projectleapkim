import React, { useState, useEffect, useCallback } from 'react';

const Dialog = ({ open, children }) => {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        {children}
      </div>
    </div>
  );
};

const Game = () => {
  const [isFirstInteraction, setIsFirstInteraction] = useState(true);
  const [gameState, setGameState] = useState('start');
  const [hp, setHp] = useState(50);
  const [objects, setObjects] = useState([]);
  const [dialogueState, setDialogueState] = useState(1);
  const [playerResponse, setPlayerResponse] = useState('');
  const [currentDialogue, setCurrentDialogue] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [backgroundPosition, setBackgroundPosition] = useState(0);  // Replace backgroundPosition1
  const [currentObjectId, setCurrentObjectId] = useState(null);

  const startGame = () => {
    setGameState('playing');
    setHp(50);
    setObjects([]);
    setBackgroundPosition(-31);
    setIsFirstInteraction(true);  // Reset first interaction state
    setTimeout(spawnObject, 4000);
};

  const spawnObject = useCallback(() => {
    if (gameState === 'playing') {
      const newObject = {
        id: Date.now(),
        type: Math.floor(Math.random() * 8) + 1,
        position: 150,
        used: false
      };
      setObjects(prev => [...prev, newObject]);
    }
  }, [gameState]);

  const handleObjectClick = (objectId) => {
    const clickedObject = objects.find(obj => obj.id === objectId);
    if (clickedObject && !clickedObject.used) {
      setGameState('dialogue');
      setDialogueState(1);
      setShowDialog(true);
      setCurrentDialogue("I'm hungry... Could you spare some food?");
      setCurrentObjectId(objectId);
    }
  };

  const handleDialogueProgress = () => {
    if (dialogueState === 1) {
      setDialogueState(2);
      setCurrentDialogue("Make me feel like giving you some.");
    } else if (dialogueState === 2) {
      setDialogueState(3);
    } else if (dialogueState === 3 && playerResponse) {
      setDialogueState(4);
      setCurrentDialogue("Hmm...");
    } else if (dialogueState === 4) {
      const isSuccessful = Math.random() < 0.7;
      if (isSuccessful) {
        setCurrentDialogue("Alright, here's something for you.");
        setHp(prev => Math.min(prev + 20, 50));
      } else {
        setCurrentDialogue("What nonsense! Go away.");
        // Modified HP reduction based on first interaction
        setHp(prev => {
          if (isFirstInteraction) {
            setIsFirstInteraction(false);  // Set to false after first interaction
            return Math.max(prev - 10, 0);  // Reduce by 10 on first failure
          } else {
            return Math.max(prev - 20, 0);  // Reduce by 20 on subsequent failures
          }
        });
      }
      setDialogueState(5);
    } else if (dialogueState === 5) {
      setObjects(prev => prev.map(obj => 
        obj.id === currentObjectId ? { ...obj, used: true } : obj
      ));
      
      setShowDialog(false);
      setGameState('playing');
      setDialogueState(1);
      setPlayerResponse('');
      setCurrentObjectId(null);
      setTimeout(spawnObject, 10000);
    }
  };

  useEffect(() => {
    let gameLoop;
    let hpLoop;
    let spawnInterval;
  
    if (gameState === 'playing') {
      gameLoop = setInterval(() => {
        // Update background position for seamless scrolling
        setBackgroundPosition(prev => {
          // Move from right to left
          const newPos = prev + 0.1;  // Changed from + to -
          // Reset when fully scrolled
          return newPos <= - 100 ? 0 : newPos;
        });
        
        // Rest of your code remains the same
        setObjects(prev => {
          const updated = prev.map(obj => ({
            ...obj,
            position: obj.position - 1
          })).filter(obj => obj.position > -5000);
          return updated;
        });
      }, 50);
  
      spawnInterval = setInterval(() => {
        spawnObject();
      }, 10000);
  
      hpLoop = setInterval(() => {
        setHp(prev => {
          const newHp = prev - 1;
          if (newHp <= 0) {
            setGameState('gameover');
            return 0;
          }
          return newHp;
        });
      }, 1000);
    }
  
    return () => {
      clearInterval(gameLoop);
      clearInterval(hpLoop);
      clearInterval(spawnInterval);
    };
  }, [gameState, spawnObject]);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      {gameState === 'start' && (
        <div className="absolute inset-0 flex items-center justify-center" onClick={startGame}>
          <img src="/images/1.png" alt="Start Screen" className="w-full h-full object-cover" />
        </div>
      )}

      {(gameState === 'playing' || gameState === 'dialogue') && (
        <>
          <div className="absolute inset-0">
          <div
  className="absolute inset-0"
  style={{
    backgroundImage: 'url(/images/2.png)',
    backgroundPosition: `${backgroundPosition}% 0`,
    backgroundSize: 'auto 100vh',    // This keeps original width ratio but fits height to screen
    backgroundRepeat: 'repeat-x',    // This ensures seamless looping
    transition: 'none'
  }}
/>
  </div>

          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 -translate-y-[10px]"
            style={{ zIndex: 20 }}
          >
            <img src="/images/3.png" alt="Character" className="h-96 object-contain" />
          </div>

          <div className="absolute top-4 left-4 right-4 h-6 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 transition-all duration-200"
              style={{ width: `${(hp / 50) * 100}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-white text-sm">
              HP: {hp}/50
            </div>
          </div>

          {objects.map(obj => (
  <div
    key={obj.id}
    className="absolute bottom-[100px]"
    style={{ 
      left: `${obj.position}%`,
      zIndex: 5,
      width: '450px',
      height: '450px'
    }}
    onClick={() => !obj.used && handleObjectClick(obj.id)}
  >
    <img 
      src={`/images/object${obj.type}.png`} 
      alt="Game Object" 
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'contain'
      }}
    />
  </div>
))}
        </>
      )}

      {gameState === 'gameover' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <img src="/images/die.png" alt="Game Over" className="w-full h-full object-cover" />
          <button onClick={startGame}
            className="absolute bottom-20 px-8 py-4 bg-blue-500 text-white text-xl rounded-lg hover:bg-blue-600 transition-colors"
          >
            Start Again
          </button>
        </div>
      )}

      <Dialog open={showDialog}>
        <div className="space-y-4">
          <p className="text-lg">{currentDialogue}</p>
          
          {dialogueState === 3 && (
            <div className="space-y-2">
              <textarea
                value={playerResponse}
                onChange={(e) => setPlayerResponse(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Type your response..."
              />
              <p className="text-sm text-gray-600">Remaining time: {hp} seconds...</p>
            </div>
          )}
          
          <button
            onClick={handleDialogueProgress}
            className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            {dialogueState === 3 ? 'Submit' : 'Continue'}
          </button>
        </div>
      </Dialog>
    </div>
  );
};

export default Game;