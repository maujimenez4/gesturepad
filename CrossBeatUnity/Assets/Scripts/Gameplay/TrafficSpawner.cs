using UnityEngine;
using CrossBeat.Core;

namespace CrossBeat.Gameplay
{
    public class TrafficSpawner : MonoBehaviour
    {
        [Header("Lane Settings")]
        [SerializeField] private bool moveLeftToRight = true;
        [SerializeField] private float laneSpeed = 3.0f;
        [SerializeField] private float spawnZBaseDelay = 2.0f; // Modified over time or by beat

        // Vehicle types handled through tags in the Object Pool
        [SerializeField] private string[] poolTags = { "Car", "Bike", "Truck" };

        private float _nextSpawnTime;
        private bool _canSpawn = true;

        [SerializeField] private SignalController signalController; // If lane has a traffic light

        private void Update()
        {
            if (!_canSpawn) return;

            // Wait for signal before spawning if applicable
            if (signalController != null && signalController.CurrentState != SignalState.Green)
            {
                return;
            }

            if (Time.time >= _nextSpawnTime)
            {
                SpawnVehicle();
                
                // Determine next spawn time (add variation/difficulty scaling)
                float currentDelay = spawnZBaseDelay;
                if (GameModeManager.Instance != null && GameModeManager.Instance.MasterConfig != null)
                {
                    // Slightly reduce delay based on score/distance to increase difficulty in Classic
                    currentDelay = Mathf.Max(
                        GameModeManager.Instance.MasterConfig.minSpawnDelayClamp, 
                        currentDelay - (ScoreManager.Instance != null ? ScoreManager.Instance.DistanceSteps * GameModeManager.Instance.MasterConfig.difficultyIncreaseRate : 0)
                    );
                }

                // Add minor randomness
                _nextSpawnTime = Time.time + currentDelay + Random.Range(-0.2f, 0.5f);
            }
        }

        private void SpawnVehicle()
        {
            if (ObjectPool.Instance == null) return;

            // Select random vehicle type
            string tagToSpawn = poolTags[Random.Range(0, poolTags.Length)];
            
            // Position
            // Assuming this spawner object is placed at the edge of the screen on the exact lane Y position
            GameObject obj = ObjectPool.Instance.SpawnFromPool(tagToSpawn, transform.position, Quaternion.identity);

            if (obj != null)
            {
                VehicleBehavior vehicle = obj.GetComponent<VehicleBehavior>();
                if (vehicle != null)
                {
                    vehicle.Initialize(moveLeftToRight ? Vector3.right : Vector3.left, laneSpeed, signalController);
                }
            }
        }

        public void SetSpawning(bool state)
        {
            _canSpawn = state;
        }
    }
}
