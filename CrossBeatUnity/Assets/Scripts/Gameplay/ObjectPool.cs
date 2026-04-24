using UnityEngine;
using System.Collections;
using System.Collections.Generic;

namespace CrossBeat.Gameplay
{
    /// <summary>
    /// A simple generic Object Pool to prevent instantiate/destroy lag on mobile.
    /// </summary>
    public class ObjectPool : MonoBehaviour
    {
        public static ObjectPool Instance { get; private set; }

        [System.Serializable]
        public class PoolParams
        {
            public string tag;
            public GameObject prefab;
            public int initialSize;
        }

        public List<PoolParams> pools;
        private Dictionary<string, Queue<GameObject>> poolDictionary;

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);

            InitPools();
        }

        private void InitPools()
        {
            poolDictionary = new Dictionary<string, Queue<GameObject>>();

            foreach (var pool in pools)
            {
                Queue<GameObject> objectQueue = new Queue<GameObject>();

                for (int i = 0; i < pool.initialSize; i++)
                {
                    GameObject obj = Instantiate(pool.prefab, transform);
                    obj.SetActive(false);
                    objectQueue.Enqueue(obj);
                }

                poolDictionary.Add(pool.tag, objectQueue);
            }
        }

        public GameObject SpawnFromPool(string tag, Vector3 position, Quaternion rotation)
        {
            if (!poolDictionary.ContainsKey(tag))
            {
                Debug.LogWarning("Pool with tag " + tag + " doesn't exist.");
                return null;
            }

            // If pool is empty, we must expand it (or handle gracefully)
            if (poolDictionary[tag].Count == 0)
            {
                // Find prefab to expand
                var poolParam = pools.Find(p => p.tag == tag);
                if (poolParam != null)
                {
                    GameObject newObj = Instantiate(poolParam.prefab, transform);
                    newObj.SetActive(false);
                    poolDictionary[tag].Enqueue(newObj);
                }
            }

            GameObject objectToSpawn = poolDictionary[tag].Dequeue();

            objectToSpawn.SetActive(true);
            objectToSpawn.transform.position = position;
            objectToSpawn.transform.rotation = rotation;

            poolDictionary[tag].Enqueue(objectToSpawn);

            return objectToSpawn;
        }

        public void ReturnToPool(GameObject obj)
        {
            obj.SetActive(false);
            // Actually it's already re-enqueued during Spawn, so just deactivating is enough
            // for simple circular queue usage.
        }
    }
}
