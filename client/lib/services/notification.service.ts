import { supabase } from '../supabase/client';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  created_at: string;
  updated_at: string;
}

export interface CreateNotificationData {
  user_id: string;
  title: string;
  message: string;
}

class NotificationService {
  async getNotifications(userId: string): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notification')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        throw error;
      }

      return data as Notification[] || [];
    } catch (err) {
      console.error('Error fetching notifications:', err);
      return [];
    }
  }

  async markAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notification')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) {
        throw error;
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
      throw err;
    }
  }

  async createNotification(notificationData: CreateNotificationData): Promise<Notification | null> {
    try {
      const { data, error } = await supabase
        .from('notification')
        .insert([notificationData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as Notification;
    } catch (err) {
      console.error('Error creating notification:', err);
      return null;
    }
  }

  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notification')
        .delete()
        .eq('id', notificationId);

      if (error) {
        throw error;
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
      throw err;
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notification')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .lt('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Notifications older than 24 hours

      if (error) {
        throw error;
      }

      return count || 0;
    } catch (err) {
      console.error('Error getting unread count:', err);
      return 0;
    }
  }

  // Helper method to create common notification types
  async notifyNewLogbookEntry(studentId: string, supervisorId: string, entryTitle: string): Promise<void> {
    try {
      // Get student name for the notification
      const { data: student } = await supabase
        .from('user_profile')
        .select('first_name, last_name')
        .eq('id', studentId)
        .single();

      if (student) {
        const studentName = `${student.first_name} ${student.last_name}`.trim();
        await this.createNotification({
          user_id: supervisorId,
          title: 'New Logbook Entry',
          message: `${studentName} has submitted a new logbook entry: "${entryTitle}". Please review and provide feedback.`
        });
      }
    } catch (err) {
      console.error('Error creating new logbook entry notification:', err);
    }
  }

  async notifyEntryReviewed(studentId: string, action: 'approved' | 'rejected', feedback: string): Promise<void> {
    try {
      // Get supervisor name for the notification
      const { data: supervisor } = await supabase
        .from('user_profile')
        .select('first_name, last_name')
        .eq('id', studentId)
        .single();

      if (supervisor) {
        const supervisorName = `${supervisor.first_name} ${supervisor.last_name}`.trim();
        await this.createNotification({
          user_id: studentId,
          title: `Logbook Entry ${action === 'approved' ? 'Approved' : 'Rejected'}`,
          message: `Your logbook entry has been ${action} by ${supervisorName}. ${feedback ? `Feedback: ${feedback}` : ''}`
        });
      }
    } catch (err) {
      console.error('Error creating entry reviewed notification:', err);
    }
  }

  async notifyStudentAssigned(studentId: string, supervisorId: string, supervisorType: 'school' | 'industry'): Promise<void> {
    try {
      const { data: student } = await supabase
        .from('user_profile')
        .select('first_name, last_name')
        .eq('id', studentId)
        .single();

      const { data: supervisor } = await supabase
        .from('user_profile')
        .select('first_name, last_name')
        .eq('id', supervisorId)
        .single();

      if (student && supervisor) {
        const studentName = `${student.first_name} ${student.last_name}`.trim();
        const supervisorName = `${supervisor.first_name} ${supervisor.last_name}`.trim();
        const typeText = supervisorType === 'school' ? 'Academic' : 'Industry';

        // Notify supervisor
        await this.createNotification({
          user_id: supervisorId,
          title: 'New Student Assignment',
          message: `You have been assigned as ${typeText} Supervisor for ${studentName}.`
        });

        // Notify student
        await this.createNotification({
          user_id: studentId,
          title: 'Supervisor Assignment',
          message: `${supervisorName} has been assigned as your ${typeText} Supervisor.`
        });
      }
    } catch (err) {
      console.error('Error creating student assignment notification:', err);
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService; 