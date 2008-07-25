import gtk

import common
import main_window

class WelcomeDialog:
    def on_button_new_clicked(self, button, data=None):
        self.welcome_dialog.hide()
        result, team_id = self.main_window.new_game_dialog()
        if result == gtk.RESPONSE_OK and team_id >= 0:
            self.main_window.new_game(team_id)
            self.main_window.unsaved_changes = True
        else:
            self.welcome_dialog.show()

    def on_button_open_clicked(self, button, data=None):
        self.welcome_dialog.hide()
        result = self.main_window.open_game_dialog()
        if result:
            self.main_window.open_game(result)
        else:
            self.welcome_dialog.show()

    def on_button_quit_clicked(self, button, data=None):
        gtk.main_quit()

    def on_welcome_dialog_delete_event(self, widget, data=None):
        gtk.main_quit()

    def __init__(self, main_window):
        self.main_window = main_window

        self.builder = gtk.Builder()
        self.builder.add_from_file(common.GTKBUILDER_PATH) 
        
        self.welcome_dialog = self.builder.get_object('welcome_dialog')

        self.builder.connect_signals(self)

        self.welcome_dialog.set_transient_for(self.main_window.main_window)

        self.welcome_dialog.show()

