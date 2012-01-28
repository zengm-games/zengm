from gi.repository import Gtk

from bbgm.util import resources


class WelcomeDialog:
    def on_button_new_clicked(self, button, data=None):
        self.welcome_dialog.hide()
        result, team_id = self.mw.new_game_dialog()
        if result == Gtk.ResponseType.OK and team_id >= 0:
            self.mw.new_game(team_id)
            self.mw.unsaved_changes = True
        else:
            self.welcome_dialog.show()

    def on_button_open_clicked(self, button, data=None):
        self.welcome_dialog.hide()
        result = self.mw.open_game_dialog()
        if result:
            self.mw.open_game(result)
        else:
            self.welcome_dialog.show()

    def on_button_quit_clicked(self, button, data=None):
        Gtk.main_quit()

    def on_welcome_dialog_delete_event(self, widget, data=None):
        Gtk.main_quit()

    def __init__(self, main_window):
        self.mw = main_window

        self.builder = Gtk.Builder()
        self.builder.add_objects_from_file(resources.get_asset('ui', 'basketball-gm.ui'), ['welcome_dialog'])

        self.welcome_dialog = self.builder.get_object('welcome_dialog')

        self.builder.connect_signals(self)

        self.welcome_dialog.set_transient_for(self.mw.main_window)

        self.welcome_dialog.show()
