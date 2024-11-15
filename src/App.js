import React, { useState, useEffect, useCallback } from 'react';

const Dialog = ({ open, children }) => {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-4 md:p-6 w-full">
        {children}
      </div>
    </div>
  );
};

const TypingText = ({ text, onComplete }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (isCompleted) return;

    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        setIsCompleted(true);
        if (onComplete) onComplete();
      }
    }, 50);

    return () => clearInterval(typingInterval);
  }, [text, onComplete, isCompleted]);

  return displayedText;
};

const GameOverText = ({ text, delay = 100 }) => {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let currentIndex = 0;

    const typingInterval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
      }
    }, delay);

    return () => clearInterval(typingInterval);
  }, [text, delay]);

  return <p>{displayedText}</p>;
};

const GameStartScreen = ({ onStart }) => {
  const texts = [
    "> Kim Satkat, a wandering poet of the 19th-century Joseon Dynasty,",
    "> came from the powerful Andong Kim family but felt ashamed due to his great-grandfather's betrayal during a rebellion.",
    "> To hide the shame of his background, he wore a large hat(Satkat in traditional Korean)",
    "> and travelled across the country, writing poems that criticised and satirised society.",
    "> Now, you are digitalised Kim Satkat.",
    "> To survive, you must beg for food.",
    "> Without food, a person naturally dies."
  ];

  const [displayedTexts, setDisplayedTexts] = useState([]);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [isTypingComplete, setIsTypingComplete] = useState(false);

  const handleTextComplete = useCallback(() => {
    setIsTypingComplete(true);
  }, []);

  const handleScreenTap = () => {
    if (isTypingComplete) {
      if (currentTextIndex < texts.length - 1) {
        setDisplayedTexts(prev => [...prev, texts[currentTextIndex]]);
        setCurrentTextIndex(prev => prev + 1);
        setIsTypingComplete(false);
      }
    }
  };

  return (
    <div 
      className="absolute inset-0 flex flex-col items-center justify-center bg-black text-white cursor-pointer" 
      onClick={handleScreenTap}
    >
      <img src="/images/1.png" alt="Start Screen" className="w-full h-full object-cover opacity-50" />
      <div className="absolute top-1/4 text-center p-4 max-w-3xl">
        {displayedTexts.map((text, index) => (
          <p key={index} className="text-white text-lg mb-2">{text}</p>
        ))}
        <div className="text-red-500 text-lg">
          <TypingText 
            text={texts[currentTextIndex]} 
            onComplete={handleTextComplete}
            key={currentTextIndex}
          />
        </div>
      </div>
      {isTypingComplete && currentTextIndex === texts.length - 1 && (
        <button 
          onClick={onStart}
          className="absolute bottom-40 left-1/2 transform -translate-x-1/2 px-8 py-4 bg-red-500 text-white text-xl rounded-lg hover:bg-blue-600 transition-colors"
        >
          Game Start
        </button>
      )}
    </div>
  );
};

const Game = () => {
  const [isBgmPlaying, setIsBgmPlaying] = useState(false);
  const [audio] = useState(new Audio('/images/bgm.mp3'));
  const [isFirstInteraction, setIsFirstInteraction] = useState(true);
  const [gameState, setGameState] = useState('start');
  const [hp, setHp] = useState(50);
  const [objects, setObjects] = useState([]);
  const [dialogueState, setDialogueState] = useState(1);
  const [playerResponse, setPlayerResponse] = useState('');
  const [currentDialogue, setCurrentDialogue] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [backgroundPosition, setBackgroundPosition] = useState(0);
  const [currentObjectId, setCurrentObjectId] = useState(null);

  const spawnObject = useCallback(() => {
    if (gameState === 'playing') {
      const newObject = {
        id: Date.now(),
        type: Math.floor(Math.random() * 8) + 1,
        position: 150,
        used: false,
        canInteract: true
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

      if (isFirstInteraction) {
        setCurrentDialogue("I'm hungry... Could you spare some food?");
        setIsFirstInteraction(false);
      } else {
        setCurrentDialogue("(You know what you need to do.)");
      }

      setCurrentObjectId({
        id: clickedObject.id,
        type: clickedObject.type
      });
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
      const isSuccessful = Math.random() < 0.4;
      if (isSuccessful) {
        setCurrentDialogue("Alright, here's something for you.");
        setHp(prev => Math.min(prev + 15, 50));
      } else {
        setCurrentDialogue("What nonsense! Go away.");
        setHp(prev => Math.max(prev - 15, 0));
      }
      setDialogueState(5);
    } else if (dialogueState === 5) {
      setObjects(prev => prev.map(obj => 
        obj.id === currentObjectId.id ? { ...obj, used: true } : obj
      ));
      
      setShowDialog(false);
      setGameState('playing');
      setDialogueState(1);
      setPlayerResponse('');
      setCurrentObjectId(null);
      setTimeout(spawnObject, 8000);
    }
  };

  const toggleBgm = () => {
    if (isBgmPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsBgmPlaying(!isBgmPlaying);
  };

  const startGame = () => {
    setGameState('playing');
    setHp(50);
    setObjects([]);
    setBackgroundPosition(-31);
    setIsFirstInteraction(true);
    setTimeout(spawnObject, 7000);
    audio.play();
    setIsBgmPlaying(true);
  };

  useEffect(() => {
    audio.loop = true;
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [audio]);

  useEffect(() => {
    let gameLoop;
    let hpLoop;
    let spawnInterval;

    if (gameState === 'playing') {
      gameLoop = setInterval(() => {
        setBackgroundPosition(prev => {
          const newPos = prev + 0.1;
          return newPos <= -100 ? 0 : newPos;
        });
        
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
      }, 8000);

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
      {gameState === 'start' && <GameStartScreen onStart={startGame} />}

      {(gameState === 'playing' || gameState === 'dialogue') && (
        <>
          <div className="absolute inset-0">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: 'url(/images/2.png)',
                backgroundPosition: `${backgroundPosition}% 0`,
                backgroundSize: 'auto 100vh',
                backgroundRepeat: 'repeat-x',
                transition: 'none'
              }}
            />
          </div>

          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 -translate-y-[10px]"
            style={{ zIndex: 20 }}
          >
            <img src="/images/3.gif" alt="Character" className="h-96 object-contain" />
          </div>

          <div className="absolute top-20 left-4 right-4 h-6 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 transition-all duration-200"
              style={{ width: `${(hp / 50) * 100}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-white text-sm">
              HP: {hp}/50
            </div>
          </div>

          <button
            className="absolute top-28 right-5 px-4 py-2 bg-red-500 hover:bg-blue-600 text-white rounded-full transition-colors"
            onClick={toggleBgm}
            style={{ zIndex: 30 }}
          >
            {isBgmPlaying ? '🔊' : '🔈'}
          </button>

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
          <div className="absolute top-40 text-center text-red-500 text-sm font-bold px-2">
            <GameOverText text="Where have the VAT payments I've made gone?" />
            <GameOverText text="What land provides me with welfare benefits?" />
          </div>

          <img src="/images/die.png" alt="Game Over" className="w-full h-full object-cover" />
          <button onClick={startGame}
            className="absolute bottom-20 px-8 py-4 bg-red-500 text-white text-xl rounded-lg hover:bg-blue-600 transition-colors"
          >
            Start Again
          </button>
        </div>
      )}

      <Dialog open={showDialog}>
        <div className="relative space-y-4 max-w-[90vw] md:max-w-[70vw] lg:max-w-[50vw] mt-5">
          <div className="absolute left-1/2 -translate-x-1/2 -top-40 z-0">
            {dialogueState === 1 ? (
              <img 
                src="/images/me.png" 
                alt="Player" 
                className="w-[180px] h-[180px] object-cover"
              />
            ) : (
              <img 
                src={`/images/owner-${currentObjectId.type}.png`} 
                alt="Owner" 
                className="w-[180px] h-[180px] object-cover"
              />
            )}
          </div>

          <div className="bg-white rounded-lg p-4 relative z-10">
            <div className="flex-1 bg-gray-100 p-3 rounded-lg">
              <p className="text-base md:text-lg break-words">{currentDialogue}</p>
            </div>
            
            {dialogueState === 3 && (
              <div className="space-y-2 mt-4">
                <textarea
                  value={playerResponse}
                  onChange={(e) => setPlayerResponse(e.target.value)}
                  className="w-full p-2 md:p-3 border rounded text-base md:text-lg"
                  placeholder="Type your response..."
                  rows="3"
                />
              </div>
            )}
            
            <button
              onClick={handleDialogueProgress}
              className="w-full mt-4 py-2 md:py-3 px-4 bg-blue-500 text-white rounded text-base md:text-lg hover:bg-blue-600 transition-colors"
            >
              {dialogueState === 3 ? 'Submit' : 'Continue'}
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default Game;