import React from 'react';
import { X, Mail, Phone, MapPin, Calendar, Briefcase, Users, Building2, Award, Heart, Globe, BookOpen, Star } from 'lucide-react';

interface UserModalProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
}

const UserModal: React.FC<UserModalProps> = ({ user, isOpen, onClose }) => {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" 
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{user.firstName} {user.lastName}</h3>
                  <p className="text-sm text-blue-100">{user.jobTitle} at {user.company}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="bg-white px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Personal Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Users className="h-5 w-5 mr-2 text-blue-600" />
                  Personal Information
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{user.email}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{user.phone}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">
                      DOB: {new Date(user.dateOfBirth).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">
                      {user.address}, {user.city}, {user.state}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Globe className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{user.country}</span>
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Briefcase className="h-5 w-5 mr-2 text-blue-600" />
                  Professional Information
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{user.company}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Award className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{user.department}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Star className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{user.jobTitle}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">
                      Joined: {new Date(user.joinDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-500">Salary:</span>
                    <span className="text-sm text-gray-900">₹{user.salary.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
                  Additional Details
                </h4>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Skills:</span>
                    <p className="text-sm text-gray-900 mt-1">{user.skills}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Experience:</span>
                    <p className="text-sm text-gray-900 mt-1">{user.experience} years</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Education:</span>
                    <p className="text-sm text-gray-900 mt-1">{user.education}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Certifications:</span>
                    <p className="text-sm text-gray-900 mt-1">{user.certifications}</p>
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Heart className="h-5 w-5 mr-2 text-red-600" />
                  Emergency Contact
                </h4>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Contact:</span>
                    <p className="text-sm text-gray-900 mt-1">{user.emergencyContact}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Phone:</span>
                    <p className="text-sm text-gray-900 mt-1">{user.emergencyPhone}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Relationship:</span>
                    <p className="text-sm text-gray-900 mt-1">{user.relationship}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Blood Group:</span>
                    <p className="text-sm text-gray-900 mt-1">{user.bloodGroup}</p>
                  </div>
                </div>
              </div>

              {/* Personal Details */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Users className="h-5 w-5 mr-2 text-blue-600" />
                  Personal Details
                </h4>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Marital Status:</span>
                    <p className="text-sm text-gray-900 mt-1">{user.maritalStatus}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Nationality:</span>
                    <p className="text-sm text-gray-900 mt-1">{user.nationality}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Languages:</span>
                    <p className="text-sm text-gray-900 mt-1">{user.languages}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Hobbies:</span>
                    <p className="text-sm text-gray-900 mt-1">{user.hobbies}</p>
                  </div>
                </div>
              </div>

              {/* Management Info */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Star className="h-5 w-5 mr-2 text-blue-600" />
                  Management Information
                </h4>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Priority:</span>
                    <p className="text-sm text-gray-900 mt-1">{user.priority}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Assigned To:</span>
                    <p className="text-sm text-gray-900 mt-1">{user.assignedTo}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Status:</span>
                    <p className="text-sm text-gray-900 mt-1">{user.status}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Work Type:</span>
                    <p className="text-sm text-gray-900 mt-1">{user.workType}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4">
            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserModal;
