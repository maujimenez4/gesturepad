using UnityEngine;
using CrossBeat.Config;

namespace CrossBeat.Core
{
    public enum GameMode
    {
        Classic,
        Zen,
        Daily
    }

    /// <summary>
    /// Singleton to persist the selected game mode and hold global references for the Game Scene.
    /// Attach to a persistent GameObject or initialize on demand.
    /// </summary>
    public class GameModeManager : MonoBehaviour
    {
        public static GameModeManager Instance { get; private set; }

        public GameMode CurrentMode { get; private set; } = GameMode.Classic;
        public GameConfig MasterConfig { get; private set; } // Reference to ScriptableObject config

        [SerializeField] private GameConfig defaultGameConfig;

        private void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                
                if (defaultGameConfig != null)
                {
                    MasterConfig = defaultGameConfig;
                }
            }
            else
            {
                Destroy(gameObject);
            }
        }

        /// <summary>
        /// Called from the Main Menu when a user selects a mode to play.
        /// </summary>
        public void SetModeAndPlay(GameMode mode)
        {
            CurrentMode = mode;
            Debug.Log($"[GameModeManager] Starting game in {mode} mode.");
            UnityEngine.SceneManagement.SceneManager.LoadScene("Game");
        }
        
        /// <summary>
        /// Inject a specific configuration (useful for Daily mode where config varies).
        /// </summary>
        public void SetConfig(GameConfig config)
        {
            MasterConfig = config;
        }
    }
}
