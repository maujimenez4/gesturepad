using UnityEngine;
using UnityEngine.UI;
using UnityEngine.SceneManagement;
using TMPro; // Assuming TextMeshPro for modern mobile UI
using CrossBeat.Core;

namespace CrossBeat.UI
{
    public class UIManager : MonoBehaviour
    {
        public static UIManager Instance { get; private set; }

        [Header("HUD")]
        [SerializeField] private GameObject hudPanel;
        [SerializeField] private TextMeshProUGUI scoreText;
        [SerializeField] private TextMeshProUGUI comboText;
        [SerializeField] private TextMeshProUGUI precisionText;
        [SerializeField] private Image beatIndicator;
        [SerializeField] private Color flowColor = Color.cyan;

        [Header("Screens")]
        [SerializeField] private GameObject pausePanel;
        [SerializeField] private GameObject gameOverPanel;
        
        [Header("Game Over Stats")]
        [SerializeField] private TextMeshProUGUI finalScoreText;
        [SerializeField] private TextMeshProUGUI finalStatsText; // E.g., Perfects, Combo, etc.

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);
        }

        private void Start()
        {
            if (ScoreManager.Instance != null)
            {
                ScoreManager.Instance.OnScoreUpdated += UpdateScoreUI;
                ScoreManager.Instance.OnFlowModeChanged += HandleFlowModeVisuals;
            }

            if (BeatManager.Instance != null)
            {
                BeatManager.Instance.OnBeatUpdated += PulseBeatIndicator;
            }

            pausePanel.SetActive(false);
            gameOverPanel.SetActive(false);
            hudPanel.SetActive(true);
        }

        private void OnDestroy()
        {
            if (ScoreManager.Instance != null)
            {
                ScoreManager.Instance.OnScoreUpdated -= UpdateScoreUI;
                ScoreManager.Instance.OnFlowModeChanged -= HandleFlowModeVisuals;
            }

            if (BeatManager.Instance != null)
            {
                BeatManager.Instance.OnBeatUpdated -= PulseBeatIndicator;
            }
        }

        private void UpdateScoreUI(int score, int combo)
        {
            if (scoreText) scoreText.text = score.ToString("0000");
            if (comboText)
            {
                if (combo > 1)
                {
                    comboText.text = $"x{combo} COMBO";
                    comboText.gameObject.SetActive(true);
                }
                else
                {
                    comboText.gameObject.SetActive(false);
                }
            }
        }

        private void HandleFlowModeVisuals(bool isFlowActive)
        {
            if (comboText != null)
            {
                comboText.color = isFlowActive ? flowColor : Color.white;
                if (isFlowActive) comboText.text = "FLOW MODE x2";
            }
        }

        public void ShowPrecisionPulse(string message, Color col)
        {
            if (precisionText)
            {
                precisionText.text = message;
                precisionText.color = col;
                // You would trigger an animation parameter here normally (e.g. fade out)
            }
        }

        private void PulseBeatIndicator()
        {
            if (beatIndicator)
            {
                // Simple hardcoded pulse. Ideally use a quick coroutine or Tween plugin like DOTween.
                beatIndicator.transform.localScale = Vector3.one * 1.5f;
                // Shrinking handled in Update
            }
        }

        private void Update()
        {
            if (beatIndicator && beatIndicator.transform.localScale.x > 1.0f)
            {
                beatIndicator.transform.localScale = Vector3.Lerp(beatIndicator.transform.localScale, Vector3.one, Time.deltaTime * 10f);
            }
        }

        // --- BUTTON CALLBACKS ---
        public void TogglePause()
        {
            bool isPaused = pausePanel.activeSelf;
            pausePanel.SetActive(!isPaused);
            Time.timeScale = isPaused ? 1.0f : 0.0f; // Freeze game physics/updates
            
            // Should also pause Audio Sources via AudioManager
        }

        public void ShowGameOver()
        {
            hudPanel.SetActive(false);
            gameOverPanel.SetActive(true);

            if (ScoreManager.Instance != null)
            {
                int score = ScoreManager.Instance.CurrentScore;
                finalScoreText.text = $"SCORE: {score}";
                finalStatsText.text = $"PERFECTS: {ScoreManager.Instance.PerfectHits}\nMAX COMBO: {ScoreManager.Instance.MaxCombo}\nDISTANCE: {ScoreManager.Instance.DistanceSteps}";

                // Save Best Score logically
            }
        }

        public void RetryGame()
        {
            Time.timeScale = 1.0f;
            SceneManager.LoadScene(SceneManager.GetActiveScene().name);
        }

        public void LoadHome()
        {
            Time.timeScale = 1.0f;
            SceneManager.LoadScene("MainMenu");
        }
    }
}
