// Supabase Kimlik Bilgileri
const SUPABASE_URL = 'https://kldfdtnotxfgzdxqyawz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsZGZkdG5vdHhmZ3pkeHF5YXd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2MjY5NDYsImV4cCI6MjA5OTIwMjk0Nn0.7I7SlA80TrXdQHyKT9_SdMM9uVuAKz8zPjBT7BIheHs';

// HATA ÇÖZÜMÜ: İsim çakışmasını engellemek için değişken adını supabaseClient yaptık
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const searchBtn = document.getElementById('searchBtn');
const trackingInput = document.getElementById('trackingCode');
const errorEl = document.getElementById('errorMessage');
const dashboard = document.getElementById('dashboard');

async function fetchDeviceData() {
    const code = trackingInput.value.toUpperCase().trim();
    if (!code) return;

    // Kullanıcıya arama yapıldığını hissettirmek için butonu kilitliyoruz
    searchBtn.innerText = "BEKLEYİN...";
    searchBtn.disabled = true;

    try {
        // İlgili izleme koduna ait en son veriyi çek
        const { data, error } = await supabaseClient
            .from('device_telemetry')
            .select('*')
            .eq('tracking_code', code)
            .order('timestamp_val', { ascending: false })
            .limit(1);

        if (error || !data || data.length === 0) {
            errorEl.style.display = 'block';
            dashboard.style.display = 'none';
            return;
        }

        const device = data[0];
        errorEl.style.display = 'none';
        dashboard.style.display = 'flex';

        // Arayüzü gelen verilerle güncelle
        document.getElementById('valDevice').innerText = `${device.brand || 'Bilinmiyor'} ${device.model || ''}`;
        document.getElementById('valOS').innerText = `Android ${device.os_version || '?'}`;
        document.getElementById('valBattery').innerText = `${device.battery}%`;
        
        const date = new Date(device.timestamp_val * 1000);
        document.getElementById('valTime').innerText = date.toLocaleTimeString('tr-TR');

        // HATA ÇÖZÜMÜ: Harita linki standart ve hatasız Google Maps Embed formatına çevrildi
        const mapHtml = `<iframe src="https://maps.google.com/maps?q=${device.latitude},${device.longitude}&hl=tr&z=15&output=embed"></iframe>`;
        
        // Eğer konum 0 ise (GPS kapalıysa) harita yerine uyarı göster
        document.getElementById('mapWrapper').innerHTML = (device.latitude && device.latitude !== 0) ? mapHtml : '<span style="color: #888;">Konum bilgisi alınamadı (Cihazın GPS\'i kapalı olabilir).</span>';

    } catch (err) {
        console.error("Hata:", err);
        errorEl.innerText = "Sisteme bağlanılamadı.";
        errorEl.style.display = 'block';
    } finally {
        // İşlem bitince butonu eski haline getir
        searchBtn.innerText = "SORGULA";
        searchBtn.disabled = false;
    }
}

searchBtn.addEventListener('click', fetchDeviceData);
trackingInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        fetchDeviceData();
    }
});
