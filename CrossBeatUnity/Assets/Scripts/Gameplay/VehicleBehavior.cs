using UnityEngine;

namespace CrossBeat.Gameplay
{
    /// <summary>
    /// Attached to a Vehicle Prefab (Car, Bike, Truck).
    /// Responsible for moving, stopping at red lights, and pushing itself back to the pool.
    /// </summary>
    public class VehicleBehavior : MonoBehaviour
    {
        private Vector3 moveDirection;
        private float currentSpeed;
        private float maxSpeed;
        private SignalController currentSignal;

        [Tooltip("Distance at which the vehicle will start braking for a red light or another car.")]
        [SerializeField] private float brakeDistance = 2.0f;
        [SerializeField] private LayerMask obstacleMask; // Vehicles or stop lines

        public void Initialize(Vector3 dir, float speed, SignalController signal)
        {
            moveDirection = dir;
            maxSpeed = speed;
            currentSpeed = maxSpeed;
            currentSignal = signal;
        }

        private void Update()
        {
            HandleMovement();
            CheckScreenBounds();
        }

        private void HandleMovement()
        {
            bool shouldBrake = false;

            // 1. Check Traffic Signal
            if (currentSignal != null && currentSignal.CurrentState == SignalState.Red)
            {
                // Simple logic: if approaching signal X, distance check. 
                // For a more advanced setup, use a Trigger Box on the lane that alerts cars.
                float distToSignal = Vector3.Distance(transform.position, currentSignal.transform.position);
                if (distToSignal < brakeDistance && distToSignal > 0.5f) // Stop just before
                {
                    shouldBrake = true;
                }
            }

            // 2. Check Car in front (Raycast approach)
            RaycastHit2D hit = Physics2D.Raycast(transform.position, moveDirection, brakeDistance, obstacleMask);
            if (hit.collider != null && hit.collider.gameObject != this.gameObject)
            {
                shouldBrake = true;
            }

            // Smooth brake / accelerate
            float targetSpeed = shouldBrake ? 0f : maxSpeed;
            currentSpeed = Mathf.Lerp(currentSpeed, targetSpeed, Time.deltaTime * 5f);

            // Move
            transform.position += moveDirection * (currentSpeed * Time.deltaTime);
        }

        private void CheckScreenBounds()
        {
            // Assuming ortho camera: destroy if far off screen
            // In a real generic setup, checking Viewport coords or distance from Camera.main is better.
            Camera cam = Camera.main;
            if (cam != null)
            {
                Vector3 vpPos = cam.WorldToViewportPoint(transform.position);
                if (vpPos.x < -0.5f || vpPos.x > 1.5f || vpPos.y < -0.5f || vpPos.y > 1.5f)
                {
                    ObjectPool.Instance.ReturnToPool(gameObject);
                }
            }
        }
    }
}
