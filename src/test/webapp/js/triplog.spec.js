describe("Triplog", function() {
    var viewModel;
    beforeEach(function () {
        viewModel = new triplog.ViewModel();
    });

    it("viewModel defined", function () {
        expect(viewModel).toBeDefined();
    });

    it("start button pressed", function () {
        viewModel.start();
        expect(viewModel.isArrivalVisible()).toBe(true);
    });
});