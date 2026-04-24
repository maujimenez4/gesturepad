using UnityEngine;
using CrossBeat.Core;

namespace CrossBeat.Gameplay
{
    public enum SignalState
    {
        Red,
        Green
    }

    /// <summary>
    /// Attach to a Traffic Light visual prefab on a specific Lane.
    /// Synchronizes its state changes to the BeatManager.
    /// </summary>
    public class SignalController : MonoBehaviour
    {
        [Header("Timing")]
        [Tooltip("Number of beats before alternating state")]
        [SerializeField] private int beatsPerPhase = 4;
        [Tooltip("Offset beats so all lights don't change at exact same time")]
        [SerializeField] private int beatOffset = 0;

        [Header("Appearance")]
        [SerializeField] private SpriteRenderer lightSprite;
        [SerializeField] private Color redColor = Color.red;
        [SerializeField] private Color greenColor = Color.green;

        public SignalState CurrentState { get; private set; } = SignalState.Green;

        private void Start()
        {
            if (BeatManager.Instance != null)
            {
                BeatManager.Instance.OnBeatUpdated += HandleBeat;
            }

            UpdateVisuals();
        }

        private void OnDestroy()
        {
            if (BeatManager.Instance != null)
            {
                BeatManager.Instance.OnBeatUpdated -= HandleBeat;
            }
        }

        private void HandleBeat()
        {
            if (BeatManager.Instance == null) return;

            int currentBeat = BeatManager.Instance.CurrentBeatCount;
            
            // Check if it's time to toggle (accounting for offset)
            if ((currentBeat + beatOffset) % beatsPerPhase == 0)
            {
                ToggleState();
            }
        }

        private void ToggleState()
        {
            CurrentState = CurrentState == SignalState.Green ? SignalState.Red : SignalState.Green;
            UpdateVisuals();
        }

        private void UpdateVisuals()
        {
            if (lightSprite != null)
            {
                lightSprite.color = CurrentState == SignalState.Green ? greenColor : redColor;
                
                // You could also trigger neon burst particles here
            }
        }
    }
}
