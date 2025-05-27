import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';
import styles from './styles/PassVerificationPage.module.css';
import Avatar from '../../components/UI/Avatar/Avatar';
import { CheckCircleIcon, XCircleIcon, ShieldExclamationIcon, HomeIcon } from '@heroicons/react/24/solid';
import logoImg from '../../images/logo.svg'; // Your app logo

const PassVerificationPage = () => {
    const { passIdentifier } = useParams();
    const [verificationResult, setVerificationResult] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (passIdentifier) {
            const verifyPass = async () => {
                setIsLoading(true);
                try {
                    const response = await api.public.get(`/passes/public-verify/${passIdentifier}`);
                    setVerificationResult(response.data);
                } catch (err) {
                    console.error("Verification error:", err.response?.data || err.message);
                    setVerificationResult({ 
                        isValid: false, 
                        message: err.response?.data?.message || "Помилка перевірки перепустки. Зверніться до адміністрації." 
                    });
                } finally {
                    setIsLoading(false);
                }
            };
            verifyPass();
        } else {
            setVerificationResult({ isValid: false, message: "Не вказано ідентифікатор перепустки." });
            setIsLoading(false);
        }
    }, [passIdentifier]);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try { return new Date(dateString).toLocaleDateString('uk-UA', { year: 'numeric', month: 'long', day: 'numeric' }); }
        catch { return 'N/A'; }
    };

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.logoHeader}>
                <img src={logoImg} alt="Dorm Life" className={styles.pageLogo} />
                <span>DORM LIFE</span>
            </div>
            <div className={`${styles.container} ${verificationResult?.isValid ? styles.valid : styles.invalid}`}>
                {isLoading ? (
                    <>
                        <div className={styles.loadingSpinner}></div>
                        <p className={styles.statusMessage}>Перевірка перепустки...</p>
                    </>
                ) : (
                    <>
                        {verificationResult?.isValid ? (
                            <CheckCircleIcon className={styles.statusIcon} />
                        ) : (
                            <XCircleIcon className={styles.statusIcon} />
                        )}
                        <h1 className={styles.title}>
                            {verificationResult?.isValid ? "Перепустка Дійсна" : "Перепустка Недійсна"}
                        </h1>
                        
                        {verificationResult?.isValid && verificationResult.studentName ? (
                            <div className={styles.passDetails}>
                                <div className={styles.detailPhoto}>
                                    <Avatar user={{ avatar: verificationResult.studentAvatar, email: 'student' }} size={100} />
                                </div>
                                <p><strong>Студент:</strong> {verificationResult.studentName}</p>
                                <p><strong>Факультет:</strong> {verificationResult.facultyName || 'N/A'}</p>
                                <p><strong>Гуртожиток:</strong> {verificationResult.dormitoryName || 'N/A'}</p>
                                <p><strong>Кімната:</strong> {verificationResult.roomDisplayNumber || 'N/A'}</p>
                                <p><strong>Дійсна до:</strong> {formatDate(verificationResult.validUntil)}</p>
                            </div>
                        ) : (
                            <p className={styles.statusMessage}>{verificationResult?.message || "Додаткова інформація відсутня."}</p>
                        )}
                    </>
                )}
                {!isLoading && (
                    <Link to="/" className={styles.homeLink}>
                        <HomeIcon /> Повернутися на головну сайту
                    </Link>
                )}
            </div>
        </div>
    );
};

export default PassVerificationPage;