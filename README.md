# Dynamic Project Data API with frontend client

An Express API meant to store project data imported from Workday and let users extend on it dynamically. An admin role can define project types with attributes specific to each project type, and users can assign project types to a project and fill out the values of the project type specific attributes. Projects cannot be added by users or admins, as they are meant to match up with what's in Workday.

Routes are secured with EntraID OAuth 2.0.