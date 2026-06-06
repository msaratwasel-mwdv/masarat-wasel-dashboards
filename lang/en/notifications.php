<?php

return [
    'student_boarding' => ':student_name has boarded the bus successfully.',
    'arrival_school' => ':student_name has arrived at school safely.',
    'approaching_home' => 'The bus is approaching home to drop off :student_name.',
    'student_absence' => ':student_name has been marked absent for today\'s trip.',
    'absence_request_processed' => 'The absence request for :student_name has been processed.',
    'chat_message' => 'You have a new message from :sender_name.',
    'address_change' => 'The home location for :student_name has been updated successfully.',
    'custom_admin_alert' => 'New administrative alert from the school.',
    'trip_started_forth' => 'The morning bus to school has started for your children: :students.',
    'trip_started_back' => 'The afternoon return bus home has started for your children: :students.',
    'student_picked_up' => 'Student :student has boarded the bus.',
    'student_dropped_off' => 'Student :student dropped off from the bus.',
    'trip_started_title' => 'Trip Update',
    'student_status_title' => 'Student Status',

    // Absence Requests
    'absence_approved_title' => 'Absence Request Update: Approved',
    'absence_approved_message' => 'Absence request for student :student has been approved',
    'absence_rejected_title' => 'Absence Request Update: Rejected',
    'absence_rejected_message' => 'Absence request for student :student has been rejected. Reason: :reason',
    'absence_alert_title' => 'Absence Alert (:type): :student',
    'absence_alert_message' => 'The guardian reported the student\'s absence (:type) on (:date). Please do not stop at the house.',

    // Location Change Request
    'location_request_title' => 'Home Location Change Request',
    'location_request_message' => 'Guardian :guardian submitted a request to change the home location for student :student',
    'initial_location_setup_title' => 'Student Home Location Setup',
    'initial_location_setup_message' => 'Guardian :guardian has set the home location for student :student for the first time.',
    'location_approved_title' => 'Location Request Update: Approved',
    'location_approved_message' => 'The location change request for :student has been approved and bus details updated.',
    'location_rejected_title' => 'Location Request Update: Rejected',
    'location_rejected_message' => 'The location change request for :student has been rejected. Reason: :reason',

    // Bus Approaching / Proximity
    'bus_approaching_title' => 'Near the house',
    'bus_approaching_message' => 'The bus is now near the house of :student. Please be ready.',
    'bus_approaching_back_message' => 'The bus is now near the house of :student.',
    'bus_proximity_to_school_title' => 'Bus is approaching to pick up :student',
    'bus_proximity_to_school_message' => 'The bus is :distance from your house and will arrive in approximately 2 minutes. Please prepare the student.',
    'bus_proximity_to_home_title' => 'Your student :student will arrive in 2 minutes',
    'bus_proximity_to_home_message' => 'The bus is :distance from your house and will arrive in approximately 2 minutes. Please be ready to receive the student.',

    // Student Absent (Trip)
    'student_absent_title' => 'Absence of student :student',
    'student_absent_message' => 'The student has been recorded as absent from the current trip.',

    // Trip Finished
    'trip_finished_title' => 'Trip finished',
    'trip_finished_message' => 'The driver has successfully finished the trip and documented that the bus is empty.',

    // Alighted (Arrived)
    'student_alighted_school_title' => 'Your student arrived at school',
    'student_alighted_school_message' => 'The student :student has arrived at school safely.',
    'student_alighted_home_title' => 'Your student arrived home',
    'student_alighted_home_message' => 'The student :student has alighted from the bus at home safely.',

    // Incident Report
    'incident_title' => ':type - Bus :bus',
    'incident_message' => 'Reported by (:role) :name. Details: :details',

    // School Attendance
    'school_attendance_title' => 'School Attendance Update',
    'school_attendance_message' => ':student has been marked as :status today.',

    // Driver notifications
    'address_change_title' => 'Student Location Updated',
    'address_change_message' => 'The home location for student :student linked to your bus has been updated.',

    // Chat
    'chat_message_title' => 'New message from :name',
    'chat_message_message' => ':message',

    // Holidays
    'holiday_announcement_title' => 'New Holiday: :holiday',
    'holiday_announcement_message' => 'A new holiday has been recorded from :start to :end',

    // Field Trips
    'field_trip_approved_title' => 'Field Trip Approved ✅',
    'field_trip_approved_message' => 'The company approved the trip: :trip. Estimated cost: :cost OMR',
    'field_trip_rejected_title' => 'Field Trip Rejected ❌',
    'field_trip_rejected_message' => 'The field trip request: :trip was rejected by management. :reason',
];
