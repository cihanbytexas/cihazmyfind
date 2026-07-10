const SUPABASE_URL = 'https://kldfdtnotxfgzdxqyawz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsZGZkdG5vdHhmZ3pkeHF5YXd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2MjY5NDYsImV4cCI6MjA5OTIwMjk0Nn0.7I7SlA80TrXdQHyKT9_SdMM9uVuAKz8zPjBT7BIheHs';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ui = {
    searchBtn: document.getElementById('searchBtn'),
    trackingInput: document.getElementById('trackingCode'),
    errorEl: document.getElementById('errorMessage'),
    dashboard: document.getElementById('dashboard'),
    alarmBtn: document.getElementById('alarmBtn'),
    flashOnBtn: document.getElementById('flashOnBtn'),
    flashOffBtn: document.getElementById('flashOffBtn'),
    volSlider: document.getElementById('volSlider'),
    volValue: document.getElementById('volValue')
};

ui.volSlider.addEventListener('input', (e) => {
    ui.volValue.innerText = `${e.target.value}%`;
});

async function fetchDeviceData() {
    const code = ui.trackingInput.value.toUpperCase().trim();
    if (!code) return;

    ui.searchBtn.innerHTML = 'BEKLEYİN...';
    ui.searchBtn.disabled = true;

    try {
        const { data, error } = await supabaseClient
            .from('device_telemetry')
            .select('*')
            .eq('tracking_code', code)
            .order('timestamp_val', { ascending: false })
            .limit(1);

        if (error || !data || data.length === 0) {
            ui.errorEl.innerText = 'Cihaz bulunamadı veya çevrimdışı.';
            ui.dashboard.classList.add('hidden');
            return;
        }

        const device = data[0];
        ui.errorEl.innerText = '';
        ui.dashboard.classList.remove('hidden');

        document.getElementById('valDevice').innerText = `${device.brand || 'Bilinmiyor'} ${device.model || ''}`;
        document.getElementById('valOS').innerText = `Android ${device.os_version || '?'}`;
        document.getElementById('valBattery').innerText = `${device.battery}%`;
        
        const date = new Date(device.timestamp_val * 1000);
        document.getElementById('valTime').innerText = date.toLocaleTimeString('tr-TR');

        const mapHtml = `<iframe src="https://maps.google.com/maps?q=${device.latitude},${device.longitude}&hl=tr&z=15&output=embed"></iframe>`;
        document.getElementById('mapWrapper').innerHTML = (device.latitude && device.latitude !== 0) ? mapHtml : '<span style="color: #888;">Konum bilgisi alınamadı.</span>';

    } catch (err) {
        ui.errorEl.innerText = "Sisteme bağlanılamadı.";
    } finally {
        ui.searchBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg> BUL';
        ui.searchBtn.disabled = false;
    }
}

async function sendCommand(commandType, btnElement, btnOriginalText) {
    const code = ui.trackingInput.value.toUpperCase().trim();
    if (!code) return;

    btnElement.innerText = "İLETİLİYOR...";
    btnElement.disabled = true;

    try {
        const { error } = await supabaseClient
            .from('device_commands')
            .insert([{ tracking_code: code, command: commandType, is_executed: false }]);

        if (error) throw error;
    } catch (err) {
        console.error("Komut Hatası:", err);
        alert("Bağlantı hatası: Komut iletilemedi.");
    } finally {
        btnElement.innerText = btnOriginalText;
        btnElement.disabled = false;
    }
}

ui.searchBtn.addEventListener('click', fetchDeviceData);

ui.trackingInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') fetchDeviceData();
});

ui.alarmBtn.addEventListener('click', () => {
    const volume = ui.volSlider.value;
    sendCommand(`PLAY_SOUND_${volume}`, ui.alarmBtn, 'SES ÇALDIR');
});

ui.flashOnBtn.addEventListener('click', () => {
    sendCommand('FLASHLIGHT_ON', ui.flashOnBtn, 'AÇ');
});

ui.flashOffBtn.addEventListener('click', () => {
    sendCommand('FLASHLIGHT_OFF', ui.flashOffBtn, 'KAPAT');
});
