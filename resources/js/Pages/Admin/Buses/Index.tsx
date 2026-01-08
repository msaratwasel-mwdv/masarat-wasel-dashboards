import { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, router, Link } from "@inertiajs/react";
import Modal from "@/Components/Modal";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";

// 1. تعريف الأنواع (Interfaces)
interface User {
  id: number;
  name: string;
}
interface School {
  id: number;
  name: string;
}

interface Bus {
  id: number;
  bus_code: string;
  plate_number: string;
  model: string;
  year: number;
  capacity: number;
  status: string;
  school_id: number | null;
  driver_id: number | null;
  supervisor_id: number | null;
  driver?: User;
  supervisor?: User;
  school?: School;
}

interface Props {
  buses: Bus[];
  availableDrivers: User[];
  availableSupervisors: User[];
  schools: School[]; // تمت إضافة قائمة المدارس هنا
}

export default function BusesIndex({
  buses,
  availableDrivers,
  availableSupervisors,
  schools,
}: Props) {
  // --- States ---
  const [isMainModalOpen, setIsMainModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);

  // نموذج الإضافة والتعديل الأساسي
  const busForm = useForm({
    plate_number: "",
    model: "",
    year: new Date().getFullYear(),
    capacity: 25,
    status: "active",
    driver_id: "",
    supervisor_id: "",
  });

  // نموذج الإسناد للمدرسة
  const assignForm = useForm({
    school_id: "",
  });

  // --- Handlers ---
  const openAddModal = () => {
    setIsEditing(false);
    busForm.reset();
    busForm.clearErrors();
    setIsMainModalOpen(true);
  };

  const openEditModal = (bus: Bus) => {
    setIsEditing(true);
    setSelectedBus(bus);
    busForm.setData({
      plate_number: bus.plate_number,
      model: bus.model,
      year: bus.year,
      capacity: bus.capacity,
      status: bus.status,
      driver_id: bus.driver_id?.toString() || "",
      supervisor_id: bus.supervisor_id?.toString() || "",
    });
    busForm.clearErrors();
    setIsMainModalOpen(true);
  };

  // فتح مودال الإسناد للمدرسة
  const openAssignModal = (bus: Bus) => {
    setSelectedBus(bus);
    assignForm.setData("school_id", bus.school_id?.toString() || "");
    assignForm.clearErrors();
    setIsAssignModalOpen(true);
  };

  const closeModal = () => {
    setIsMainModalOpen(false);
    setIsAssignModalOpen(false);
    busForm.reset();
    assignForm.reset();
  };

  const submitBusForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && selectedBus) {
      busForm.put(route("admin.buses.update", selectedBus.id), {
        onSuccess: () => closeModal(),
      });
    } else {
      busForm.post(route("admin.buses.store"), {
        onSuccess: () => closeModal(),
      });
    }
  };

  const submitAssignForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedBus) {
      assignForm.post(route("admin.buses.assign", selectedBus.id), {
        onSuccess: () => closeModal(),
      });
    }
  };

  const deleteBus = (id: number) => {
    if (confirm("Are you sure you want to archive this bus?")) {
      router.delete(route("admin.buses.destroy", id));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "maintenance":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "out_of_service":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <AuthenticatedLayout
      header={
        <h2 className="font-bold text-xl text-gray-800">Fleet Management</h2>
      }
    >
      <Head title="Buses" />

      <div className="py-6">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-brand-dark">Bus Fleet</h1>
              <p className="text-sm text-gray-500">
                Manage company vehicles and assignments.
              </p>
            </div>
            <PrimaryButton
              onClick={openAddModal}
              className="bg-brand-yellow text-brand-dark hover:bg-yellow-500 shadow-md"
            >
              + Add New Bus
            </PrimaryButton>
          </div>

          {/* Table */}
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-2xl border border-gray-100">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Bus Info
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Assigned School
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Crew
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {buses.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-gray-400"
                    >
                      No buses found.
                    </td>
                  </tr>
                ) : (
                  buses.map((bus) => (
                    <tr
                      key={bus.id}
                      className="hover:bg-gray-50 transition group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded bg-brand-navy/10 text-brand-navy flex items-center justify-center font-bold">
                            {bus.bus_code}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-bold text-gray-900">
                              {bus.plate_number}
                            </div>
                            <div className="text-xs text-gray-500">
                              {bus.model} ({bus.year})
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {bus.school ? (
                          <span className="text-sm font-medium text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-100">
                            {bus.school.name}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 italic">
                            Unassigned (Free Pool)
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs space-y-1">
                        <div className="text-gray-600">
                          <span className="font-bold">D:</span>{" "}
                          {bus.driver?.name || "N/A"}
                        </div>
                        <div className="text-gray-600">
                          <span className="font-bold">S:</span>{" "}
                          {bus.supervisor?.name || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full border uppercase ${getStatusColor(
                            bus.status
                          )}`}
                        >
                          {bus.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openAssignModal(bus)}
                          className="text-green-600 hover:text-green-900 mr-4 font-bold"
                        >
                          Assign
                        </button>
                        <button
                          onClick={() => openEditModal(bus)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4 font-bold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteBus(bus.id)}
                          className="text-red-500 hover:text-red-700 font-bold"
                        >
                          Archive
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* --- 1. Main Modal (Create/Edit) --- */}
          <Modal show={isMainModalOpen} onClose={closeModal}>
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6 border-b pb-3">
                {isEditing ? `Edit Bus Details` : "Add New Bus to Fleet"}
              </h2>
              <form onSubmit={submitBusForm} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <InputLabel value="Plate Number" />
                    <TextInput
                      value={busForm.data.plate_number}
                      onChange={(e) =>
                        busForm.setData("plate_number", e.target.value)
                      }
                      className="w-full mt-1"
                    />
                    <InputError message={busForm.errors.plate_number} />
                  </div>
                  <div>
                    <InputLabel value="Capacity" />
                    <TextInput
                      type="number"
                      value={busForm.data.capacity}
                      onChange={(e) =>
                        busForm.setData("capacity", Number(e.target.value))
                      }
                      className="w-full mt-1"
                    />
                    <InputError message={busForm.errors.capacity} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <InputLabel value="Model" />
                    <TextInput
                      value={busForm.data.model}
                      onChange={(e) => busForm.setData("model", e.target.value)}
                      className="w-full mt-1"
                    />
                    <InputError message={busForm.errors.model} />
                  </div>
                  <div>
                    <InputLabel value="Year" />
                    <TextInput
                      type="number"
                      value={busForm.data.year}
                      onChange={(e) =>
                        busForm.setData("year", Number(e.target.value))
                      }
                      className="w-full mt-1"
                    />
                    <InputError message={busForm.errors.year} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border">
                  <div>
                    <InputLabel value="Assign Driver" />
                    <select
                      className="w-full border-gray-300 rounded-md mt-1 text-sm"
                      value={busForm.data.driver_id}
                      onChange={(e) =>
                        busForm.setData("driver_id", e.target.value)
                      }
                    >
                      <option value="">-- No Driver --</option>
                      {availableDrivers.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <InputLabel value="Assign Supervisor" />
                    <select
                      className="w-full border-gray-300 rounded-md mt-1 text-sm"
                      value={busForm.data.supervisor_id}
                      onChange={(e) =>
                        busForm.setData("supervisor_id", e.target.value)
                      }
                    >
                      <option value="">-- No Supervisor --</option>
                      {availableSupervisors.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <SecondaryButton onClick={closeModal}>Cancel</SecondaryButton>
                  <PrimaryButton disabled={busForm.processing}>
                    Save Bus
                  </PrimaryButton>
                </div>
              </form>
            </div>
          </Modal>

          {/* --- 2. Assign to School Modal --- */}
          <Modal show={isAssignModalOpen} onClose={closeModal}>
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-2">
                Assign Bus to School
              </h2>
              <p className="text-sm text-gray-500 mb-6 italic">
                Note: Assigning this bus will also link its current driver and
                supervisor to the school.
              </p>

              <form onSubmit={submitAssignForm} className="space-y-6">
                <div>
                  <InputLabel value="Select School" />
                  <select
                    className="w-full border-gray-300 focus:border-brand-yellow focus:ring-brand-yellow rounded-lg mt-1"
                    value={assignForm.data.school_id}
                    onChange={(e) =>
                      assignForm.setData("school_id", e.target.value)
                    }
                    required
                  >
                    <option value="">-- Select School --</option>
                    {schools.map((school) => (
                      <option key={school.id} value={school.id}>
                        {school.name}
                      </option>
                    ))}
                  </select>
                  <InputError message={assignForm.errors.school_id} />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <SecondaryButton onClick={closeModal}>Cancel</SecondaryButton>
                  <PrimaryButton
                    className="bg-green-600 hover:bg-green-700"
                    disabled={assignForm.processing}
                  >
                    Confirm Assignment
                  </PrimaryButton>
                </div>
              </form>
            </div>
          </Modal>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
