using UnityEngine;
using UnityEngine.UI;
using UnityEngine.SceneManagement;

namespace CrossBeat.UI
{
    public class SettingsController : MonoBehaviour
    {
        [Header("Toggles")]
        [SerializeField] private Toggle vibrationToggle;
        [SerializeField] private Toggle beatAssistToggle;

        [Header("Sliders")]
        [SerializeField] private Slider musicVolumeSlider;
        [SerializeField] private Slider sfxVolumeSlider;

        private void Start()
        {
            LoadSettings();
        }

        private void LoadSettings()
        {
            if (vibrationToggle) vibrationToggle.isOn = PlayerPrefs.GetInt("Vibration", 1) == 1;
            if (beatAssistToggle) beatAssistToggle.isOn = PlayerPrefs.GetInt("BeatAssist", 1) == 1;
            
            if (musicVolumeSlider) musicVolumeSlider.value = PlayerPrefs.GetFloat("VolumeMusic", 1.0f);
            if (sfxVolumeSlider) sfxVolumeSlider.value = PlayerPrefs.GetFloat("VolumeSFX", 1.0f);
        }

        public void SaveSettings()
        {
            if (vibrationToggle) PlayerPrefs.SetInt("Vibration", vibrationToggle.isOn ? 1 : 0);
            if (beatAssistToggle) PlayerPrefs.SetInt("BeatAssist", beatAssistToggle.isOn ? 1 : 0);
            
            if (musicVolumeSlider) PlayerPrefs.SetFloat("VolumeMusic", musicVolumeSlider.value);
            if (sfxVolumeSlider) PlayerPrefs.SetFloat("VolumeSFX", sfxVolumeSlider.value);

            PlayerPrefs.Save();

            // Re-apply volumes instantly if AudioManager exists
            if (CrossBeat.Audio.AudioManager.Instance != null)
            {
                CrossBeat.Audio.AudioManager.Instance.ApplyVolumes();
            }
        }

        public void GoBack()
        {
            SaveSettings();
            SceneManager.LoadScene("MainMenu");
        }
    }
}
