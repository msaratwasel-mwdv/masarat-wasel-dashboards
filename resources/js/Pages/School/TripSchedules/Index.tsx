import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import SchoolAuthenticatedLayout from '@/Layouts/SchoolAuthenticatedLayout';
import useTranslation from '@/hooks/useTranslation';

interface TripSchedule {
    id: number;
    bus_id: number;
    bus_number: string;
    day_of_week: number;
    gathering_time: string;
    departure_time: string;
    return_time: string;
    last_dropoff_time: string;
    is_exception: boolean;
    exception_reason?: string;
}

interface Props {
    auth: any;
    schedules: TripSchedule[];
    buses: any[];
}

export default function Index({ auth, schedules = [], buses = [] }: Props) {
    const { t } = useTranslation();
    const [selectedDay, setSelectedDay] = useState(0); // 0 = Sunday
    const [showModal, setShowModal] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState<TripSchedule | null>(null);

    const { data, setData, post, put, processing, reset } = useForm({
        bus_id: '',
        day_of_week: selectedDay,
        gathering_time: '06:30',
        departure_time: '07:00',
        return_time: '14:00',
        last_dropoff_time: '15:00',
    });

    const days = [
        { id: 0, name: t('Sunday'), icon: '☀️', color: 'from-yellow-400 to-orange-500' },
        { id: 1, name: t('Monday'), icon: '🌙', color: 'from-blue-400 to-cyan-500' },
        { id: 2, name: t('Tuesday'), icon: '💫', color: 'from-purple-400 to-pink-500' },
        { id: 3, name: t('Wednesday'), icon: '⭐', color: 'from-green-400 to-emerald-500' },
        { id: 4, name: t('Thursday'), icon: '🌟', color: 'from-red-400 to-pink-500' },
    ];

    const daySchedules = schedules.filter(s => s.day_of_week === selectedDay);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingSchedule) {
            put(route('school.trip-schedules.update', editingSchedule.id), {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                    setEditingSchedule(null);
                }
            });
        } else {
            post(route('school.trip-schedules.store'), {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                }
            });
        }
    };

    const openModal = (schedule?: TripSchedule) => {
        if (schedule) {
            setEditingSchedule(schedule);
            setData({
                bus_id: schedule.bus_id.toString(),
                day_of_week: schedule.day_of_week,
                gathering_time: schedule.gathering_time,
                departure_time: schedule.departure_time,
                return_time: schedule.return_time,
                last_dropoff_time: schedule.last_dropoff_time,
            });
        } else {
            setData({ ...data, day_of_week: selectedDay });
        }
        setShowModal(true);
    };

    return (
        <SchoolAuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        {t('Trip Schedules')}
                    </h2>
                    <button
                        onClick={() => openModal()}
                        className="px-6 py-3 bg-gradient-to-r from-brand-yellow to-orange-500 text-gray-900 font-bold rounded-xl hover:from-yellow-500 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                        + {t('Add Schedule')}
                    </button>
                </div>
            }
        >
            <Head title={t('Trip Schedules')} />

            <div className="space-y-6">
                {/* Week Days Tabs - Premium Design */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {days.map((day) => (
                            <button
                                key={day.id}
                                onClick={() => setSelectedDay(day.id)}
                                className={`group relative overflow-hidden p-6 rounded-xl transition-all duration-300 transform ${
                                    selectedDay === day.id
                                        ? `bg-gradient-to-br ${day.color} shadow-2xl scale-105`
                                        : 'bg-gray-100 dark:bg-gray-700 hover:scale-102 hover:shadow-lg'
                                }`}
                            >
                                {selectedDay === day.id && (
                                    <div className="absolute inset-0 bg-white/20 backdrop-blur-sm" />
                                )}
                                <div className="relative text-center space-y-2">
                                    <div className="text-4xl">{day.icon}</div>
                                    <div className={`font-bold text-sm ${selectedDay === day.id ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                        {day.name}
                                    </div>
                                    {daySchedules.length > 0 && selectedDay === day.id && (
                                        <div className="text-xs text-white/90">{daySchedules.length} {t('buses')}</div>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Schedules Display */}
                {daySchedules.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {daySchedules.map((schedule) => (
                            <div
                                key={schedule.id}
                                className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300"
                            >
                                {/* Gradient Header */}
                                <div className={`p-6 bg-gradient-to-r ${days[selectedDay].color} text-white`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-white/20 backdrop-blur-lg rounded-xl flex items-center justify-center">
                                                <span className="text-3xl">🚌</span>
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-bold">{schedule.bus_number}</h3>
                                                <p className="text-white/80 text-sm">{days[selectedDay].name}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => openModal(schedule)}
                                            className="p-2 bg-white/20 backdrop-blur-lg rounded-lg hover:bg-white/30 transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                {/* Timeline */}
                                <div className="p-6 space-y-4">
                                    <div className="relative pl-8">
                                        {/* Timeline Line */}
                                        <div className="absolute left-2 top-4 bottom-4 w-1 bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500 rounded-full" />

                                        {/* Time Points */}
                                        <div className="space-y-6">
                                            {/* Gathering */}
                                            <div className="relative flex items-center gap-4">
                                                <div className="absolute -left-7 w-5 h-5 bg-blue-500 rounded-full border-4 border-white dark:border-gray-800 shadow-lg" />
                                                <div className="flex-1 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase">{t('Gathering Time')}</span>
                                                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{schedule.gathering_time}</p>
                                                        </div>
                                                        <span className="text-3xl">👥</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Departure */}
                                            <div className="relative flex items-center gap-4">
                                                <div className="absolute -left-7 w-5 h-5 bg-green-500 rounded-full border-4 border-white dark:border-gray-800 shadow-lg" />
                                                <div className="flex-1 bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <span className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase">{t('Departure Time')}</span>
                                                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{schedule.departure_time}</p>
                                                        </div>
                                                        <span className="text-3xl">🚀</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Return */}
                                            <div className="relative flex items-center gap-4">
                                                <div className="absolute -left-7 w-5 h-5 bg-orange-500 rounded-full border-4 border-white dark:border-gray-800 shadow-lg" />
                                                <div className="flex-1 bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4">
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <span className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase">{t('Return Time')}</span>
                                                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{schedule.return_time}</p>
                                                        </div>
                                                        <span className="text-3xl">🏠</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Last Dropoff */}
                                            <div className="relative flex items-center gap-4">
                                                <div className="absolute -left-7 w-5 h-5 bg-purple-500 rounded-full border-4 border-white dark:border-gray-800 shadow-lg" />
                                                <div className="flex-1 bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase">{t('Last Dropoff')}</span>
                                                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{schedule.last_dropoff_time}</p>
                                                        </div>
                                                        <span className="text-3xl">✅</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center">
                        <div className="text-8xl mb-6">{days[selectedDay].icon}</div>
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{t('No schedules for this day')}</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">{t('Add a schedule to get started')}</p>
                        <button
                            onClick={() => openModal()}
                            className="px-8 py-3 bg-gradient-to-r from-brand-yellow to-orange-500 text-gray-900 font-bold rounded-xl hover:from-yellow-500 hover:to-orange-600 transition-all shadow-lg"
                        >
                            + {t('Add Schedule')}
                        </button>
                    </div>
                )}
            </div>


            {/* Premium Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden transform animate-slideUp">
                        {/* Header with Gradient */}
                        <div className="relative overflow-hidden bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 p-8">
                            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
                            <div className="relative flex items-center gap-4">
                                <div className="w-16 h-16 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center">
                                    <span className="text-4xl">📅</span>
                                </div>
                                <div>
                                    <h3 className="text-3xl font-extrabold text-white drop-shadow-lg">
                                        {editingSchedule ? t('Edit Schedule') : t('Add Schedule')}
                                    </h3>
                                    <p className="text-white/90 text-sm mt-1">{t('Fill out the form below to submit your request')}</p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                            {/* Bus Selection */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                                    <span className="text-xl">🚌</span>
                                    {t('Select Bus')} <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={data.bus_id}
                                    onChange={e => setData('bus_id', e.target.value)}
                                    className="w-full px-4 py-3.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all font-semibold"
                                    required
                                >
                                    <option value="">{t('Select Bus')}</option>
                                    {buses.map(bus => (
                                        <option key={bus.id} value={bus.id}>
                                            {bus.bus_number} - {bus.plate_number}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Time Inputs Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Gathering Time */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                                        <span className="text-xl">👥</span>
                                        {t('Gathering Time')} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="time"
                                        value={data.gathering_time}
                                        onChange={e => setData('gathering_time', e.target.value)}
                                        className="w-full px-4 py-3.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        required
                                    />
                                </div>

                                {/* Departure Time */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                                        <span className="text-xl">🚀</span>
                                        {t('Departure Time')} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="time"
                                        value={data.departure_time}
                                        onChange={e => setData('departure_time', e.target.value)}
                                        className="w-full px-4 py-3.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                        required
                                    />
                                </div>

                                {/* Return Time */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                                        <span className="text-xl">🏠</span>
                                        {t('Return Time')} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="time"
                                        value={data.return_time}
                                        onChange={e => setData('return_time', e.target.value)}
                                        className="w-full px-4 py-3.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                                        required
                                    />
                                </div>

                                {/* Last Dropoff */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                                        <span className="text-xl">✅</span>
                                        {t('Last Dropoff')} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="time"
                                        value={data.last_dropoff_time}
                                        onChange={e => setData('last_dropoff_time', e.target.value)}
                                        className="w-full px-4 py-3.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="flex gap-4 pt-6 border-t-2 border-gray-200 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        reset();
                                        setEditingSchedule(null);
                                    }}
                                    className="flex-1 px-6 py-3.5 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all font-bold"
                                >
                                    ❌ {t('Cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 px-6 py-3.5 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-extrabold rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                >
                                    {processing ? '⏳ ' + t('Saving...') : '✅ ' + t('Save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </SchoolAuthenticatedLayout>
    );
}
