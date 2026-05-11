import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import { FormEventHandler } from 'react';

export default function CreateDriver() {
    // إعداد الـ Form باستخدام Inertia
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        national_id: '',
        email: '',
        phone: '',
        license_number: '',
        license_expiry_date: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('admin.drivers.store')); // تأكد أن الراوت موجود
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="font-bold text-xl text-gray-800 leading-tight">Register New Driver</h2>}
        >
            <Head title="Add Driver" />

            <div className="py-6">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">

                    {/* --- Header Section --- */}
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-brand-dark">New Driver Registration</h1>
                            <p className="text-sm text-gray-500 mt-1">Add a new driver to the company fleet pool.</p>
                        </div>
                        <Link
                            href={route('admin.drivers.index')} // سننشئ صفحة العرض لاحقاً
                            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium text-sm"
                        >
                            Cancel & Return
                        </Link>
                    </div>

                    {/* --- Form Card --- */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-2xl border border-gray-100">
                        <div className="p-8">
                            <form onSubmit={submit}>

                                {/* Section 1: Personal Information */}
                                <div className="mb-8">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-brand-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                        Personal Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Full Name */}
                                        <div>
                                            <InputLabel htmlFor="name" value="Full Name" />
                                            <TextInput
                                                id="name"
                                                type="text"
                                                className="mt-1 block w-full"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                placeholder="e.g. Faisal Al-Harbi"
                                                isFocused={true}
                                            />
                                            <InputError message={errors.name} className="mt-2" />
                                        </div>

                                        {/* Civil ID */}
                                        <div>
                                            <InputLabel htmlFor="national_id" value="Civil ID / Iqama" />
                                            <TextInput
                                                id="national_id"
                                                type="text"
                                                className="mt-1 block w-full"
                                                value={data.national_id}
                                                onChange={(e) => setData('national_id', e.target.value)}
                                                placeholder="10xxxxxxxx"
                                            />
                                            <InputError message={errors.national_id} className="mt-2" />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Contact Details */}
                                <div className="mb-8">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-brand-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                        Contact Details
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Phone Number */}
                                        <div>
                                            <InputLabel htmlFor="phone" value="Mobile Number" />
                                            <TextInput
                                                id="phone"
                                                type="text"
                                                className="mt-1 block w-full"
                                                value={data.phone}
                                                onChange={(e) => setData('phone', e.target.value)}
                                                placeholder="05xxxxxxxx"
                                            />
                                            <p className="text-xs text-gray-400 mt-1">This will be used as the initial password.</p>
                                            <InputError message={errors.phone} className="mt-2" />
                                        </div>

                                        {/* Email Address */}
                                        <div>
                                            <InputLabel htmlFor="email" value="Email Address" />
                                            <TextInput
                                                id="email"
                                                type="email"
                                                className="mt-1 block w-full"
                                                value={data.email}
                                                onChange={(e) => setData('email', e.target.value)}
                                                placeholder="driver@example.com"
                                            />
                                            <InputError message={errors.email} className="mt-2" />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 3: Professional Details */}
                                <div className="mb-8">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-brand-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0c0 .883-.393 1.627-1.008 2.138a3.001 3.001 0 01-1.464 2.868A3.001 3.001 0 0113.5 12a2.48 2.48 0 01-1.04-.226l-1.636 2.046a.75.75 0 01-1.166 0l-1.636-2.046A2.48 2.48 0 017 12a3.001 3.001 0 012-5.862z" /></svg>
                                        License Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* License Number */}
                                        <div>
                                            <InputLabel htmlFor="license_number" value="Driving License Number" />
                                            <TextInput
                                                id="license_number"
                                                type="text"
                                                className="mt-1 block w-full bg-yellow-50 border-yellow-200 focus:border-yellow-400 focus:ring-yellow-200"
                                                value={data.license_number}
                                                onChange={(e) => setData('license_number', e.target.value)}
                                                placeholder="License No."
                                            />
                                            <InputError message={errors.license_number} className="mt-2" />
                                        </div>

                                        {/* Expiry Date */}
                                        <div>
                                            <InputLabel htmlFor="license_expiry_date" value="License Expiry Date" />
                                            <TextInput
                                                id="license_expiry_date"
                                                type="date"
                                                className="mt-1 block w-full"
                                                value={data.license_expiry_date}
                                                onChange={(e) => setData('license_expiry_date', e.target.value)}
                                            />
                                            <InputError message={errors.license_expiry_date} className="mt-2" />
                                        </div>
                                    </div>
                                </div>

                                {/* Form Actions */}
                                <div className="flex items-center justify-end gap-4 pt-6 border-t">
                                    <Link
                                        href={route('admin.drivers.index')}
                                        className="text-sm text-gray-600 hover:text-gray-900 underline"
                                    >
                                        Cancel
                                    </Link>

                                    <PrimaryButton className="px-8 py-3 bg-brand-dark hover:bg-brand-navy" disabled={processing}>
                                        {processing ? 'Registering...' : 'Save & Register Driver'}
                                    </PrimaryButton>
                                </div>

                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
