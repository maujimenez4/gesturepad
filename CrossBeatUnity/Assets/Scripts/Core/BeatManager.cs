using UnityEngine;
using System;
using CrossBeat.Config;

namespace CrossBeat.Core
{
    public enum BeatHitType
    {
        Miss,
        Good,
        Perfect
    }

    /// <summary>
    /// Handles the rhythm mechanics based on AudioSettings.dspTime to ensure exact precision.
    /// Calculates Beat accuracy windows given a BPM.
    /// </summary>
    public class BeatManager : MonoBehaviour
    {
        public static BeatManager Instance { get; private set; }

        public event Action OnBeatUpdated; // Fired precisely on the beat
        
        [Header("Beat Configuration")]
        [SerializeField] private float bpm = 120f;
        
        // Expose current beat for other systems (like Traffic Spawner/Signals)
        public int CurrentBeatCount { get; private set; }

        private double _secPerBeat;
        private double _songPosition;
        private double _dspStartTime;
        
        private GameConfig _config;

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);
        }

        private void Start()
        {
            _config = GameModeManager.Instance != null ? GameModeManager.Instance.MasterConfig : null;
            SetBPM(bpm);
            StartMetronome();
        }

        public void SetBPM(float newBPM)
        {
            bpm = newBPM;
            _secPerBeat = 60d / bpm;
        }

        public void StartMetronome()
        {
            _dspStartTime = AudioSettings.dspTime;
            CurrentBeatCount = 0;
            StartCoroutine(MetronomeRoutine());
        }

        private void Update()
        {
            // For UI elements that need smooth interpolation, we can calculate song position in seconds
            _songPosition = AudioSettings.dspTime - _dspStartTime;
        }

        private System.Collections.IEnumerator MetronomeRoutine()
        {
            while (true)
            {
                double timeSinceStart = AudioSettings.dspTime - _dspStartTime;
                double nextBeatTime = _dspStartTime + (CurrentBeatCount + 1) * _secPerBeat;

                double timeToWait = nextBeatTime - AudioSettings.dspTime;
                
                if (timeToWait > 0)
                {
                    // WaitForSeconds is inexact, so we yield slightly before and spin-wait the rest
                    // or just use yield return null and check in Update for a more standard Unity approach.
                    // For perfect synchronization, checking dspTime in a tight Update loop is normally better.
                    // But to save CPU on mobile, yielding until very close, then checking:
                    yield return new WaitForSecondsRealtime((float)timeToWait - 0.05f);
                }

                while (AudioSettings.dspTime < nextBeatTime)
                {
                    yield return null;
                }

                CurrentBeatCount++;
                OnBeatUpdated?.Invoke();
            }
        }

        /// <summary>
        /// Evaluates current input timing against the metronome.
        /// </summary>
        public BeatHitType EvaluateHit()
        {
            double hitTime = AudioSettings.dspTime - _dspStartTime;
            double beatExpectedTime = CurrentBeatCount * _secPerBeat;
            double nextBeatExpectedTime = (CurrentBeatCount + 1) * _secPerBeat;

            // Find nearest beat
            double diffToCurrent = Math.Abs(hitTime - beatExpectedTime);
            double diffToNext = Math.Abs(nextBeatExpectedTime - hitTime);
            double minDiff = Math.Min(diffToCurrent, diffToNext);

            float perfectWindow = _config != null ? _config.perfectWindow : 0.07f;
            float goodWindow = _config != null ? _config.goodWindow : 0.14f;

            if (minDiff <= perfectWindow)
            {
                return BeatHitType.Perfect;
            }
            if (minDiff <= goodWindow)
            {
                return BeatHitType.Good;
            }

            return BeatHitType.Miss;
        }
    }
}
