using UnityEngine;
using UnityEngine.SceneManagement;
using TMPro; // For UI text
using CrossBeat.Core;

namespace CrossBeat.UI
{
    public class MainMenuController : MonoBehaviour
    {
        [Header("UI References")]
        [SerializeField] private TextMeshProUGUI bestScoreClassicText;
        [SerializeField] private TextMeshProUGUI bestScoreZenText;
        [SerializeField] private TextMeshProUGUI dailyInfoText;

        private void Start()
        {
            LoadScores();
            SetupDailyInfo();
        }

        private void LoadScores()
        {
            int bestClassic = PlayerPrefs.GetInt("BestScore_Classic", 0);
            int bestZen = PlayerPrefs.GetInt("BestScore_Zen", 0);

            if (bestScoreClassicText) bestScoreClassicText.text = $"Best Classic: {bestClassic}";
            if (bestScoreZenText) bestScoreZenText.text = $"Best Zen: {bestZen}";
        }

        private void SetupDailyInfo()
        {
            // Re-use logic from DailyManager (assuming DailyManager configures via seed)
            string seed = PlayerPrefs.GetString("CurrentDailySeed", "20240101");
            
            // Pseudo-random generation based on seed string to display info
            int dateHash = seed.GetHashCode();
            System.Random dailyRandom = new System.Random(dateHash);
            
            int dailyBPM = dailyRandom.Next(100, 145);
            int trackIndex = dailyRandom.Next(1, 15);
            
            string patternName = dailyRandom.Next(0, 2) == 0 ? "Heavy Traffic" : "Fast Lanes";

            if (dailyInfoText)
            {
                dailyInfoText.text = $"TODAY\nBPM: {dailyBPM}\nTrack: #{trackIndex}\nPattern: {patternName}";
            }
        }

        // --- BUTTON CALLBACKS ---
        public void PlayClassic()
        {
            if (GameModeManager.Instance != null) GameModeManager.Instance.SetModeAndPlay(GameMode.Classic);
        }

        public void PlayZen()
        {
            if (GameModeManager.Instance != null) GameModeManager.Instance.SetModeAndPlay(GameMode.Zen);
        }

        public void PlayDaily()
        {
            if (GameModeManager.Instance != null) GameModeManager.Instance.SetModeAndPlay(GameMode.Daily);
        }

        public void OpenSettings()
        {
            SceneManager.LoadScene("Settings");
        }

        public void OpenHowToPlay()
        {
            SceneManager.LoadScene("HowToPlay");
        }
    }
}
