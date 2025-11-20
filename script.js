const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const micBtn = document.querySelector('.mic-btn');
const transcriptEl = document.getElementById('transcript');
const totalEl = document.getElementById('total-value');
const cashEl = document.getElementById('cash-value');
const changeEl = document.getElementById('change-value');
let isListening = false;
let recognition;


if (!SpeechRecognition) {
    transcriptEl.innerText = " มือถือรุ่นนี้ไม่รองรับระบบสั่งงานด้วยเสียงครับ (ลองเปลี่ยน Browser)";
    micBtn.style.background = "gray";
    micBtn.disabled = true;
} else {
    recognition = new SpeechRecognition();
    recognition.lang = 'th-TH';
    recognition.continuous = false;
    recognition.interimResults = false; 

    
    recognition.onerror = (event) => {
        console.error(event.error);
        micBtn.classList.remove('listening');
        isListening = false;
        
        if(event.error === 'not-allowed') {
            transcriptEl.innerText = " กรุณากด 'อนุญาต' ให้ใช้ไมโครโฟน";
            alert("คุณต้องกด Allow/อนุญาต ให้ใช้ไมค์ก่อนครับ");
        } else if (event.error === 'no-speech') {
            transcriptEl.innerText = " ไม่ได้ยินเสียง (เงียบเกินไป)";
        } else if (event.error === 'network') {
            transcriptEl.innerText = " ต้องต่อเน็ตถึงจะใช้ได้ครับ";
        } else {
            transcriptEl.innerText = " Error: " + event.error;
        }
    };

    recognition.onend = () => {
        micBtn.classList.remove('listening');
        isListening = false;
    };

    recognition.onresult = (event) => {
        const text = event.results[0][0].transcript;
        transcriptEl.innerText = ` "${text}"`;
        calculateMoney(text);
    };
}

function toggleMic() {
    if (!recognition) return;

    if (!isListening) {
        try {
           
            let unlockSound = new SpeechSynthesisUtterance("");
            window.speechSynthesis.speak(unlockSound);

            recognition.start();
            micBtn.classList.add('listening');
            transcriptEl.innerText = "กำลังรับฟัง... (พูดมาเลย)";
            isListening = true;
        } catch (e) {
            transcriptEl.innerText = " กดไมค์ไม่ได้: " + e.message;
        }
    } else {
        recognition.stop();
        isListening = false;
    }
}

function calculateMoney(text) {
    let cleanText = text
        .replace(/หนึ่ง/g, '1').replace(/สอง/g, '2').replace(/สาม/g, '3')
        .replace(/สี่/g, '4').replace(/ห้า/g, '5').replace(/หก/g, '6')
        .replace(/เจ็ด/g, '7').replace(/แปด/g, '8').replace(/เก้า/g, '9')
        .replace(/ศูนย์/g, '0');

    cleanText = cleanText.replace(/จ่าย|รับ|ให้/g, '|');

    cleanText = cleanText
        .replace(/มา/g, '')     
        .replace(/บาท/g, '')    
        .replace(/ครับ/g, '').replace(/ค่ะ/g, '')
        .replace(/ทอน/g, '')        
        .replace(/เท่าไหร่/g, '')   
        .replace(/เท่าไร/g, '')     
        .replace(/กี่บาท/g, '')     
        .replace(/,/g, '')      
        .replace(/ /g, '');     

    cleanText = cleanText
        .replace(/บวก/g, '+').replace(/ลบ/g, '-').replace(/ลด/g, '-').replace(/หัก/g, '-')
        .replace(/คูณ/g, '*').replace(/หาร/g, '/')
        .replace(/(\d+(\.\d+)?)ล้าน/g, '$1*1000000+')
        .replace(/(\d+(\.\d+)?)แสน/g, '$1*100000+')
        .replace(/(\d+(\.\d+)?)หมื่น/g, '$1*10000+')
        .replace(/(\d+(\.\d+)?)พัน/g, '$1*1000+')
        .replace(/(\d+(\.\d+)?)ร้อย/g, '$1*100+')
        .replace(/แบงค์ร้อย/g, '100').replace(/แบงค์พัน/g, '1000')
        .replace(/แบงค์ห้าร้อย/g, '500').replace(/แบงค์ห้าสิบ/g, '50').replace(/แบงค์ยี่สิบ/g, '20');

    let parts = cleanText.split('|');

    try {
        const safeEval = (str) => {
            if (!str) return 0;
            if (['+', '-', '*', '/'].includes(str.slice(-1))) str = str.slice(0, -1);
            return eval(str);
        };

        let totalPrice = safeEval(parts[0]);
        if (totalPrice < 0) totalPrice = 0;
        totalEl.innerText = totalPrice.toLocaleString();

        if (parts.length > 1 && parts[1].length > 0) {
            let cashAmount = safeEval(parts[1]);
            cashEl.innerText = cashAmount.toLocaleString();

            if (cashAmount < totalPrice) {
                let missing = totalPrice - cashAmount;
                changeEl.innerText = "ขาด " + missing.toLocaleString();
                changeEl.classList.add('missing-money');
                speak(`ขาดอีก ${missing} บาท`);
            } else {
                let change = cashAmount - totalPrice;
                changeEl.innerText = change.toLocaleString();
                changeEl.classList.remove('missing-money');
                speak(`ทอน ${change} บาท`);
            }
        } else {
            cashEl.innerText = "-";
            changeEl.innerText = "-";
            changeEl.classList.remove('missing-money');
            speak(`รวม ${totalPrice} บาท`);
        }

    } catch (e) {
        console.error(e);
        transcriptEl.innerText = " ฟังไม่เข้าใจ (" + cleanText + ")";
    }
}

function speak(msg) {
    let speech = new SpeechSynthesisUtterance(msg);
    speech.lang = 'th-TH';
    window.speechSynthesis.speak(speech);
}