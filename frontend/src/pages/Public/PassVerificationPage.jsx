import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import api from '../../utils/api';
import styles from './styles/PassVerificationPage.module.css';
import Avatar from '../../components/UI/Avatar/Avatar';
import { CheckCircleIcon, XCircleIcon, HomeIcon } from '@heroicons/react/24/outline';
import logoImg from '../../images/logo.svg';

const PassVerificationPage = () => {
    const { passIdentifier } = useParams();
    const [passDetails, setPassDetails] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const { user, isLoading: isUserLoading } = useUser();
    const navigate = useNavigate();

    useEffect(() => {
        const verifyPass = async () => {
            if (!passIdentifier) {
                setError("Ідентифікатор перепустки відсутній.");
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            try {
                const response = await api.public.get(`/passes/public-verify/${passIdentifier}`);
                setPassDetails(response.data);
            } catch (err) {
                const errorMessage = err.response?.data?.message || "Сталася помилка під час перевірки.";
                setError(errorMessage);
            } finally {
                setIsLoading(false);
            }
        };

        verifyPass();
    }, [passIdentifier]);

    const handleReturnHome = () => {
        if (user) {
            navigate('/dashboard');
        } else {
            navigate('/login');
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('uk-UA', { year: 'numeric', month: 'long', day: 'numeric' });
        } catch { return 'N/A'; }
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <>
                    <div className={styles.loadingSpinner}></div>
                    <p className={styles.statusMessage}>Перевірка даних перепустки...</p>
                </>
            );
        }

        if (error || !passDetails?.isValid) {
            return (
                <>
                    <XCircleIcon className={styles.statusIcon} />
                    <h2 className={styles.title}>Перепустка недійсна</h2>
                    <p className={styles.statusMessage}>{error || passDetails?.message || "Перепустку не знайдено або термін її дії закінчився."}</p>
                </>
            );
        }

        return (
            <>
                <CheckCircleIcon className={styles.statusIcon} />
                <h2 className={styles.title}>Перепустка дійсна</h2>
                <div className={styles.passDetails}>
                    <div className={styles.detailPhoto}>
                        <Avatar user={{ avatar: passDetails.studentAvatar, email: passDetails.studentName }} size={90} />
                    </div>
                    <p><strong>П.І.Б.:</strong> {passDetails.studentName}</p>
                    <p><strong>Факультет:</strong> {passDetails.facultyName || 'N/A'}</p>
                    <p><strong>Гуртожиток:</strong> {passDetails.dormitoryName || 'N/A'}</p>
                    <p><strong>Кімната:</strong> {passDetails.roomDisplayNumber || 'N/A'}</p>
                    <p><strong>Дійсна до:</strong> {formatDate(passDetails.validUntil)}</p>
                </div>
            </>
        );
    };

    return (
        <div className={styles.pageWrapper}>
            <header className={styles.logoHeader}>
                <img src={logoImg} alt="Dorm Life Logo" className={styles.pageLogo} />
                <span>DORM LIFE</span>
            </header>
            <main className={`${styles.container} ${isLoading ? '' : (error || !passDetails?.isValid ? styles.invalid : styles.valid)}`}>
                {renderContent()}
                <button
                    onClick={handleReturnHome}
                    className={styles.homeLink}
                    disabled={isUserLoading}
                >
                    <HomeIcon />
                    {isUserLoading ? 'Перевірка сесії...' : 'Повернутися на головну'}
                </button>
            </main>
        </div>
    );
};

export default PassVerificationPage;