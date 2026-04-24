using UnityEngine;
using System.Collections;

namespace CrossBeat.Audio
{
    /// <summary>
    /// Very basic Audio Manager to handle playing loops and SFX.
    /// Placeholders are used; hooks left for CC0 / Royalty Free audio.
    /// </summary>
    public class AudioManager : MonoBehaviour
    {
        public static AudioManager Instance { get; private set; }

        [Header("Audio Sources")]
        [SerializeField] private AudioSource musicSource;
        [SerializeField] private AudioSource sfxSource;

        [Header("SFX Clips (Assign in Inspector)")]
        [SerializeField] private AudioClip swipeClip;
        [SerializeField] private AudioClip perfectChimeClip;
        [SerializeField] private AudioClip crashClip;
        [SerializeField] private AudioClip flowModeEnterClip;

        private void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
            }
            else
            {
                Destroy(gameObject);
                return;
            }

            ApplyVolumes();
        }

        public void ApplyVolumes()
        {
            if (musicSource) musicSource.volume = PlayerPrefs.GetFloat("VolumeMusic", 1.0f);
            if (sfxSource) sfxSource.volume = PlayerPrefs.GetFloat("VolumeSFX", 1.0f);
        }

        public void PlayMusic(AudioClip track)
        {
            if (musicSource == null || track == null) return;
            musicSource.clip = track;
            musicSource.loop = true;
            musicSource.Play();
        }

        public void StopMusic()
        {
            if (musicSource) musicSource.Stop();
        }

        public void PlaySFX(AudioClip clip)
        {
            if (sfxSource != null && clip != null)
            {
                sfxSource.PlayOneShot(clip);
            }
        }

        // --- Specific SFX Hooks ---
        public void PlaySwipe() { PlaySFX(swipeClip); }
        public void PlayPerfectChime() 
        { 
            // Only play if not silenced by user setting
            if (PlayerPrefs.GetInt("BeatAssist", 1) == 1) 
                PlaySFX(perfectChimeClip); 
        }
        public void PlayCrash() { PlaySFX(crashClip); }
        public void PlayFlowMode() { PlaySFX(flowModeEnterClip); }
    }
}
