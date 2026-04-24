using UnityEngine;

namespace CrossBeat.Config
{
    [CreateAssetMenu(fileName = "NewGameConfig", menuName = "CrossBeat/Game Configuration")]
    public class GameConfig : ScriptableObject
    {
        [Header("General Settings")]
        public float cameraScrollSpeedClassic = 2.0f;
        public float playerStepDistance = 1.0f; // Typical grid unit size
        public float gameSpeedMultiplier = 1.0f; // Scales as game progresses

        [Header("Beat & Rhythm Windows (seconds)")]
        [Tooltip("± Window for a Perfect hit. (e.g. 0.07 = 70ms)")]
        public float perfectWindow = 0.07f;
        [Tooltip("± Window for a Good hit. (e.g. 0.14 = 140ms)")]
        public float goodWindow = 0.14f;

        [Header("Score & Combos")]
        public int baseStepScore = 1;
        public int perfectBonusScore = 5;
        public int goodBonusScore = 2;
        public int flowModeRequirement = 10; // Consecutive perfects to trigger flow
        public float flowModeDuration = 5.0f;

        [Header("Traffic Difficulty Curve")]
        public float initialSpawnDelay = 2.0f;
        public float minSpawnDelayClamp = 0.5f; // Fastes spawn rate possible
        public float difficultyIncreaseRate = 0.01f; // Reduced from spawn delay per second

        // In a real project, you might have lists of Level Data or Music Tracks here.
    }
}
