const SUPABASE_URL = 'https://kldfdtnotxfgzdxqyawz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsZGZkdG5vdHhmZ3pkeHF5YXd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2MjY5NDYsImV4cCI6MjA5OTIwMjk0Nn0.7I7SlA80TrXdQHyKT9_SdMM9uVuAKz8zPjBT7BIheHs';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const searchBtn = document.getElementById('searchBtn');
const alarmBtn = document.getElementById('alarmBtn');
const trackingInput = document.getElementById('trackingCode');
const errorEl = document.getElementById('errorMessage');
const dashboard = document.getElementById('dashboard');

async function fetchDeviceData() {
    const code = trackingInput.value.toUpperCase().trim();
    if (!code) return;

    searchBtn.innerText = "BEKLEYİN...";
    searchBtn.disabled = true;

    try {
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

        document.getElementById('valDevice').innerText = `${device.brand || 'Bilinmiyor'} ${device.model || ''}`;
        document.getElementById('valOS').innerText = `Android ${device.os_version || '?'}`;
        document.getElementById('valBattery').innerText = `${device.battery}%`;
        
        const date = new Date(device.timestamp_val * 1000);
        document.getElementById('valTime').innerText = date.toLocaleTimeString('tr-TR');

        const mapHtml = `<iframe src="https://maps.google.com/maps?q=${device.latitude},${device.longitude}&hl=tr&z=15&output=embed"></iframe>`;
        document.getElementById('mapWrapper').innerHTML = (device.latitude && device.latitude !== 0) ? mapHtml : '<span style="color: #888;">Konum bilgisi alınamadı (Cihazın GPS\'i kapalı olabilir).</span>';

    } catch (err) {
        console.error("Hata:", err);
        errorEl.innerText = "Sisteme bağlanılamadı.";
        errorEl.style.display = 'block';
    } finally {
        searchBtn.innerText = "SORGULA";
        searchBtn.disabled = false;
    }
}

// YENİ: Uzaktan Alarm Çaldırma Komut Tetikleyicisi
async function triggerRemoteAlarm() {
    const code = trackingInput.value.toUpperCase().trim();
    if (!code) return;

    alarmBtn.innerText = "KOMUT GÖNDERİLİYOR...";
    alarmBtn.disabled = true;

    try {
        const { error } = await supabaseClient
            .from('device_commands')
            .insert([{ tracking_code: code, command: 'PLAY_SOUND', is_executed: false }]);

        if (error) throw error;
        alert("Alarm komutu başarıyla gönderildi! Cihaz bir sonraki kalp atışında (maksimum 60sn) sesini fulleyerek çalmaya başlayacaktır.");

    } catch (err) {
        console.error("Komut Hatası:", err);
        alert("Komut gönderilemedi, lütfen bağlantınızı kontrol edin.");
    } finally {
        alarmBtn.innerText = "ALARM ÇALDIR (Sesi Fulle)";
        alarmBtn.disabled = false;
    }
}

searchBtn.addEventListener('click', fetchDeviceData);
alarmBtn.addEventListener('click', triggerRemoteAlarm);
trackingInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        fetchDeviceData();
    }
});
