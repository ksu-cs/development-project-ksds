import { ref, onMounted } from 'vue';

export function fetchGeojson(pathString) {
    const data = ref(null);
    const loading = ref(true);
    const error = ref(null);
    
    // Define asynchronous function to fetch data.
    const f = async () => {
        try {
            const res = await fetch('/geojson/' + pathString);
            data.value = await res.json();
        } catch (e) {
            error.value = e;
        } finally {
            loading.value = false;
        }
    }

    // Execute function on mount.
    onMounted(f);

    // Expose properties.
    return { data, loading, error };
}