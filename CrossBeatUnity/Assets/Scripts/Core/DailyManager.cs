using UnityEngine;
using CrossBeat.Config;

namespace CrossBeat.Core
{
    /// <summary>
    /// Parses the Daily Seed and generates a specialized GameConfig out of it.
    /// This ensures every player experiences the exact same parameters on any given day.
    /// Attach to an object in the MainMenu or Boot scene, or call statically.
    /// </summary>
    public static class DailyManager
    {
        public static GameConfig GenerateDailyConfig(GameConfig defaultReference)
        {
            // We create a temporary instance of the configuration derived from the default
            GameConfig dailyConfig = ScriptableObject.CreateInstance<GameConfig>();
            
            // Set basics
            dailyConfig.cameraScrollSpeedClassic = defaultReference.cameraScrollSpeedClassic;
            dailyConfig.playerStepDistance = defaultReference.playerStepDistance;
            dailyConfig.perfectWindow = defaultReference.perfectWindow;
            dailyConfig.goodWindow = defaultReference.goodWindow;
            dailyConfig.baseStepScore = defaultReference.baseStepScore;
            dailyConfig.perfectBonusScore = defaultReference.perfectBonusScore;
            dailyConfig.goodBonusScore = defaultReference.goodBonusScore;
            dailyConfig.flowModeRequirement = defaultReference.flowModeRequirement;
            dailyConfig.flowModeDuration = defaultReference.flowModeDuration;
            
            // Calculate Daily specific numbers
            string seed = PlayerPrefs.GetString("CurrentDailySeed", System.DateTime.Now.ToString("yyyyMMdd"));
            int dateHash = seed.GetHashCode();
            System.Random dailyRandom = new System.Random(dateHash);

            // Difficulty Tweaks based on Seed
            // Random initial spawn delay between 1.0s (hard) to 3.0s (easy)
            dailyConfig.initialSpawnDelay = 1.0f + ((float)dailyRandom.NextDouble() * 2.0f); 
            
            // We modify scaling speed slightly
            dailyConfig.difficultyIncreaseRate = 0.005f + ((float)dailyRandom.NextDouble() * 0.015f);

            // Note: True 'Daily' Track music BPM is injected conceptually here, 
            // but BeatManager actually needs to read this value later.
            float chosenBPM = dailyRandom.Next(100, 145);
            // Example: you would pass this to the BeatManager on Start.

            return dailyConfig;
        }
    }
}
