using UnityEngine;
using System;
using CrossBeat.Config;

namespace CrossBeat.Core
{
    public class ScoreManager : MonoBehaviour
    {
        public static ScoreManager Instance { get; private set; }

        public event Action<int, int> OnScoreUpdated; // Score, Combo
        public event Action<bool> OnFlowModeChanged;

        public int CurrentScore { get; private set; }
        public int CurrentCombo { get; private set; }
        public int MaxCombo { get; private set; }
        public bool IsInFlowMode { get; private set; }
        
        // Stats for summary
        public int PerfectHits { get; private set; }
        public int GoodHits { get; private set; }
        public int Misses { get; private set; }
        public int FlowTriggers { get; private set; }
        public int DistanceSteps { get; private set; }

        private GameConfig config;
        private float flowModeTimer = 0f;

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);
        }

        private void Start()
        {
            config = GameModeManager.Instance != null ? GameModeManager.Instance.MasterConfig : null;
        }

        private void Update()
        {
            if (IsInFlowMode)
            {
                flowModeTimer -= Time.deltaTime;
                if (flowModeTimer <= 0)
                {
                    ExitFlowMode();
                }
            }
        }

        public void AddStep(BeatHitType hitType)
        {
            DistanceSteps++;

            int pointsToAdd = config != null ? config.baseStepScore : 1;
            int multiplier = IsInFlowMode ? 2 : 1;

            switch (hitType)
            {
                case BeatHitType.Perfect:
                    PerfectHits++;
                    pointsToAdd += (config != null ? config.perfectBonusScore : 5);
                    IncrementCombo();
                    break;
                case BeatHitType.Good:
                    GoodHits++;
                    pointsToAdd += (config != null ? config.goodBonusScore : 2);
                    IncrementCombo();
                    break;
                case BeatHitType.Miss:
                    Misses++;
                    ResetCombo();
                    break;
            }

            CurrentScore += (pointsToAdd * multiplier);
            OnScoreUpdated?.Invoke(CurrentScore, CurrentCombo);
        }

        private void IncrementCombo()
        {
            CurrentCombo++;
            if (CurrentCombo > MaxCombo) MaxCombo = CurrentCombo;

            // Check Flow Mode
            int flowReq = config != null ? config.flowModeRequirement : 10;
            if (CurrentCombo >= flowReq && !IsInFlowMode)
            {
                EnterFlowMode();
            }
        }

        public void ResetCombo()
        {
            CurrentCombo = 0;
            if (IsInFlowMode)
            {
                ExitFlowMode();
            }
            OnScoreUpdated?.Invoke(CurrentScore, CurrentCombo);
        }

        private void EnterFlowMode()
        {
            IsInFlowMode = true;
            FlowTriggers++;
            flowModeTimer = config != null ? config.flowModeDuration : 5.0f;
            OnFlowModeChanged?.Invoke(true);
            Debug.Log("[ScoreManager] Entered FLOW MODE!");
        }

        private void ExitFlowMode()
        {
            IsInFlowMode = false;
            OnFlowModeChanged?.Invoke(false);
            Debug.Log("[ScoreManager] Exited Flow Mode.");
        }
    }
}
