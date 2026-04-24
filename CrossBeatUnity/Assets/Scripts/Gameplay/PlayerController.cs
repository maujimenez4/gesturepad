using UnityEngine;
using System.Collections;
using CrossBeat.Core;

namespace CrossBeat.Gameplay
{
    /// <summary>
    /// Handles One-Thumb swipe controls and discrete grid-based movement with easing and visual squash/stretch.
    /// Also evaluates Beat accuracy on every swipe.
    /// </summary>
    public class PlayerController : MonoBehaviour
    {
        [Header("Movement Settings")]
        [SerializeField] private float moveDuration = 0.15f; // How fast the hop takes
        private float stepDistance = 1.0f; // Taken from config
        
        [Header("Visuals")]
        [SerializeField] private Transform spriteTransform; // Drag child holding SpriteRenderer here
        [SerializeField] private TrailRenderer trailRenderer;
        [SerializeField] private ParticleSystem perfectSparks;
        [SerializeField] private ParticleSystem crashExplosion;
        
        private Vector2 touchStartPos;
        private bool isSwiping = false;
        private bool isMoving = false;
        private bool isDead = false;

        private Vector3 targetPosition;

        private void Start()
        {
            if (GameModeManager.Instance != null && GameModeManager.Instance.MasterConfig != null)
            {
                stepDistance = GameModeManager.Instance.MasterConfig.playerStepDistance;
            }
            targetPosition = transform.position;
        }

        private void Update()
        {
            if (isDead || isMoving) return;

            HandleInput();
        }

        private void HandleInput()
        {
            // Desktop/Editor Fallback Input
            if (Input.GetKeyDown(KeyCode.UpArrow) || Input.GetKeyDown(KeyCode.W)) TryMove(Vector3.up);
            else if (Input.GetKeyDown(KeyCode.DownArrow) || Input.GetKeyDown(KeyCode.S)) TryMove(Vector3.down);
            else if (Input.GetKeyDown(KeyCode.LeftArrow) || Input.GetKeyDown(KeyCode.A)) TryMove(Vector3.left);
            else if (Input.GetKeyDown(KeyCode.RightArrow) || Input.GetKeyDown(KeyCode.D)) TryMove(Vector3.right);

            // Touch Swipe Input
            if (Input.touchCount > 0)
            {
                Touch touch = Input.GetTouch(0);

                if (touch.phase == TouchPhase.Began)
                {
                    isSwiping = true;
                    touchStartPos = touch.position;
                }
                else if (touch.phase == TouchPhase.Ended && isSwiping)
                {
                    isSwiping = false;
                    Vector2 swipeDelta = touch.position - touchStartPos;

                    if (swipeDelta.magnitude > 50f) // Minimum swipe distance threshold
                    {
                        swipeDelta.Normalize();
                        if (Mathf.Abs(swipeDelta.x) > Mathf.Abs(swipeDelta.y))
                        {
                            // Horizontal Swipe
                            TryMove(swipeDelta.x > 0 ? Vector3.right : Vector3.left);
                        }
                        else
                        {
                            // Vertical Swipe
                            TryMove(swipeDelta.y > 0 ? Vector3.up : Vector3.down);
                        }
                    }
                }
            }
        }

        private void TryMove(Vector3 direction)
        {
            targetPosition = transform.position + (direction * stepDistance);
            
            // Audio Feedback (Play swipe SFX)
            if(CrossBeat.Audio.AudioManager.Instance != null)
            {
                CrossBeat.Audio.AudioManager.Instance.PlaySwipe();
            }

            // Beat Evaluation
            if (BeatManager.Instance != null && ScoreManager.Instance != null)
            {
                BeatHitType hitResult = BeatManager.Instance.EvaluateHit();
                
                // Only register step forward as a metric, but give bonuses strictly on timing
                if (direction == Vector3.up)
                {
                    ScoreManager.Instance.AddStep(hitResult);
                }

                // If hit perfectly, do some flashy visual and SFX
                if (hitResult == BeatHitType.Perfect)
                {
                    if (perfectSparks != null) perfectSparks.Play();
                    if(CrossBeat.Audio.AudioManager.Instance != null)
                        CrossBeat.Audio.AudioManager.Instance.PlayPerfectChime();
                }
            }
            
            StartCoroutine(MoveRoutine(targetPosition));
        }

        private IEnumerator MoveRoutine(Vector3 endPos)
        {
            isMoving = true;
            Vector3 startPos = transform.position;
            float elapsedTime = 0;

            while (elapsedTime < moveDuration)
            {
                elapsedTime += Time.deltaTime;
                float progress = elapsedTime / moveDuration;
                
                // Smooth Step or simple Lerp
                float curve = Mathf.SmoothStep(0, 1, progress);
                
                transform.position = Vector3.Lerp(startPos, endPos, curve);
                
                // Simple Squash and Stretch
                if(spriteTransform != null)
                {
                    float yVal = curve < 0.5f ? Mathf.Lerp(1f, 0.8f, curve * 2f) : Mathf.Lerp(0.8f, 1f, (curve - 0.5f) * 2f);
                    float xVal = curve < 0.5f ? Mathf.Lerp(1f, 1.2f, curve * 2f) : Mathf.Lerp(1.2f, 1f, (curve - 0.5f) * 2f);
                    spriteTransform.localScale = new Vector3(xVal, yVal, 1f);
                }

                yield return null;
            }

            transform.position = endPos;
            if (spriteTransform != null) spriteTransform.localScale = Vector3.one;
            isMoving = false;
            
            // In Classic mode, check if we're out of bounds (handled elsewhere or by trigger)
        }

        private void OnTriggerEnter2D(Collider2D collision)
        {
            if (isDead) return;

            if (collision.CompareTag("Vehicle"))
            {
                Die();
            }
            else if (collision.CompareTag("DeathZone")) // E.g., camera trailing behind
            {
                Die();
            }
        }

        private void Die()
        {
            isDead = true;
            Debug.Log("[Player] GAME OVER");
            
            if(CrossBeat.Audio.AudioManager.Instance != null)
                CrossBeat.Audio.AudioManager.Instance.PlayCrash();
                
            if (crashExplosion != null)
            {
                crashExplosion.transform.SetParent(null); // Detach so it survives player destroy/disable
                crashExplosion.Play();
            }
            
            if (trailRenderer != null) trailRenderer.enabled = false;
            if (spriteTransform != null) spriteTransform.gameObject.SetActive(false); // Hide

            // Optional: Trigger vibration
            if (PlayerPrefs.GetInt("Vibration", 1) == 1)
            {
                Handheld.Vibrate();
            }

            // Notify UI / GameModeManager to show Game Over Overlay
            if (UIManager.Instance != null)
            {
                UIManager.Instance.ShowGameOver();
            }
        }
    }
}
