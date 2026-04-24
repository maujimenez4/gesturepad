using UnityEngine;
using UnityEngine.SceneManagement;
using System.Collections;

namespace CrossBeat.Core
{
    /// <summary>
    /// Serves as the initial entry point of the game (Cold Start).
    /// Handles initializing essential persistent services before loading the Main Menu.
    /// Attach this to an empty GameObject in the 'Boot' scene.
    /// </summary>
    public class BootLoader : MonoBehaviour
    {
        [Header("Settings")]
        [Tooltip("Name of the Main Menu scene to load after initialization.")]
        [SerializeField] private string mainMenuSceneName = "MainMenu";
        
        [Tooltip("Minimum time (seconds) to display the boot screen/splash.")]
        [SerializeField] private float minBootTime = 2.0f;

        private void Start()
        {
            // Start the initialization coroutine
            StartCoroutine(InitializeGameRoutine());
        }

        private IEnumerator InitializeGameRoutine()
        {
            float startTime = Time.realtimeSinceStartup;

            // 1. Initialize PlayerPrefs wrapper and Settings
            InitializeSettings();

            // 2. Setup Daily Config logic
            InitializeDailySeed();

            // 3. Ensure persistent managers exist (Audio, BeatManager shell)
            // In a modular setup, you can either Instantiate prefabs marked with DontDestroyOnLoad here
            // or rely on a "Systems" prefab loaded once.

            // Ensure we wait for the minimum boot duration (to show off the cool neon splash)
            float eclipseTime = Time.realtimeSinceStartup - startTime;
            if (eclipseTime < minBootTime)
            {
                yield return new WaitForSeconds(minBootTime - eclipseTime);
            }

            // Transition to Main Menu
            LoadMainMenu();
        }

        private void InitializeSettings()
        {
            // E.g., apply default volume, target frame rate
            Application.targetFrameRate = 60; // Smooth mobile experience

            // Load saved settings if they exist, otherwise set defaults
            if (!PlayerPrefs.HasKey("VolumeMusic")) PlayerPrefs.SetFloat("VolumeMusic", 1.0f);
            if (!PlayerPrefs.HasKey("VolumeSFX")) PlayerPrefs.SetFloat("VolumeSFX", 1.0f);
            if (!PlayerPrefs.HasKey("Vibration")) PlayerPrefs.SetInt("Vibration", 1);
            if (!PlayerPrefs.HasKey("BeatAssist")) PlayerPrefs.SetInt("BeatAssist", 1);
            
            PlayerPrefs.Save();
            
            Debug.Log("[BootLoader] Settings Initialized.");
        }

        private void InitializeDailySeed()
        {
            // Using YYYYMMDD format to seed deterministic daily challenges
            string dateStr = System.DateTime.Now.ToString("yyyyMMdd");
            PlayerPrefs.SetString("CurrentDailySeed", dateStr);
            PlayerPrefs.Save();
            
            Debug.Log($"[BootLoader] Daily Seed Initialized: {dateStr}");
        }

        private void LoadMainMenu()
        {
            Debug.Log("[BootLoader] Loading Main Menu...");
            // Asynchronously load the main menu
            SceneManager.LoadSceneAsync(mainMenuSceneName);
        }
    }
}
